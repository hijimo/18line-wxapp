/**
 * 微信虚拟支付（米大师）封装 — 线路打赏专用
 *
 * 官方文档：https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestVirtualPayment.html
 * 设计文档：docs/architecture/virtual-payment-reward-design.md §6（支付时序）、§11.1（接口契约）、§12.1（错误码）
 *
 * ## 三条不可动摇的红线
 *
 * 1. **signData 原样透传，禁止二次序列化。**
 *    后端基于它已序列化好的字符串计算 paySig 与 signature，前端再 JSON.stringify
 *    会改变字段顺序/空格，直接导致 -15006（支付签名错误）。
 *
 * 2. **success 回调不是支付成功的凭证。**
 *    真实到账以微信服务端发货推送落库为准。前端必须轮询
 *    GET /wx/reward/order/{outTradeNo} 读服务端状态；且该接口只读本地库，
 *    支付后短时间内读到「待支付」是正常现象（推送/补偿任务会在几分钟内追平），
 *    **不能据此判定支付失败**，应展示「处理中」。
 *
 * 3. **-2（用户取消）不是错误。**
 *    用户主动取消支付属于正常操作路径，不弹错误提示、不上报异常。
 *
 * 4. **session_key 失效要以「重登 + 重试一次」自愈，判定要覆盖 4001 / -15007 / -15005。**
 *    用户态签名依赖后端持有的 session_key，而它会被微信轮换；只认其中一个码，
 *    其余形态就会退化成「用户反复失败、服务端零日志」。
 *    但注意：**签名类失败在微信侧不会留下订单**，所以「订单停在待支付」不足以推出
 *    session_key 失效——必须用 `query_order` 确认微信侧到底有没有这笔单，
 *    否则会像 2026-10-18 那样把支付面板环节的失败误判成签名问题。
 */

import { wxLogin } from './authorize';
import { login } from '../services/auth';
import { TOKEN_KEY } from './request';
import {
  createRewardOrder,
  getRewardOrderStatus,
  reportRewardPayError,
} from '../services/reward';
import { REWARD_ERR, VPAY_ERR } from '../types/reward';
import type { RewardOrderCreateParams, RewardOrderStatusResult } from '../types/reward';

/** wx.requestVirtualPayment 要求的最低基础库版本 */
const MIN_SDK_VERSION = '2.19.2';

/**
 * 支持虚拟支付的终端，取值必须与 wx.getSystemInfoSync().platform 的**官方合法值**逐字对齐：
 * ios / android / ohos / ohos_pc / windows / mac / devtools。
 *
 * ⚠️ 鸿蒙是 `ohos`（手机）与 `ohos_pc`（PC），**微信从不返回 `harmony`**。
 * 这里曾误写成 'harmony'，鸿蒙真机因此被判定为「当前设备暂不支持该功能」，
 * 且前端直接短路、连档位接口都不请求，服务端零日志 —— 静默失败，极难发现。
 * 官方口径：虚拟支付「适用于 Android、iOS、鸿蒙、Windows 等所有终端」，
 * 设备路由把 Android / 鸿蒙 / Windows 一并路由到微信支付。
 *
 * 不含 devtools（工具内无法真实支付）与 mac（官方设备路由表未列 macOS 微信）。
 * 后端 RewardOrderServiceImpl.SUPPORTED_PLATFORMS 与本数组必须同步修改。
 */
const SUPPORTED_PLATFORMS = ['android', 'ios', 'ohos', 'ohos_pc', 'windows'];

/** 轮询间隔与次数：8 × 1500ms ≈ 12 秒，覆盖绝大多数推送延迟 */
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 8;

/** 模块级支付锁，防止连点造成重复下单 */
let paying = false;

export interface VirtualPaymentCapability {
  supported: boolean;
  platform: string;
  sdkVersion: string;
  /** 不支持时的用户可读原因，supported=true 时为 undefined */
  reason?: string;
}

export interface VirtualPaymentError extends Error {
  /** wx.requestVirtualPayment 的 errCode，或后端业务码 */
  errCode?: number;
  /**
   * 微信返回的原始 errMsg。
   * -15001（参数错误）的具体原因**只在 errMsg 里**，丢掉它就等于丢掉唯一的定位线索。
   */
  errMsg?: string;
  /** 用户主动取消 */
  cancelled?: boolean;
}

/** 打赏编排的最终结果 */
export type RewardPayOutcome =
  | { status: 'success'; order: RewardOrderStatusResult }
  | { status: 'pending'; message: string; outTradeNo: string }
  | { status: 'cancelled' }
  | { status: 'unsupported'; message: string }
  | { status: 'failed'; message: string; errCode?: number; errMsg?: string };

export type RewardPayStage =
  | 'creating-order'
  | 'invoking-payment'
  | 'confirming'
  | 'done';

export interface PayLineRewardOptions {
  /**
   * 线路打赏的业务关联锚点。
   * 与 expertRouteId **互斥且必填其一**：两个都传或都不传都会在出网前抛错。
   */
  lineId?: number;
  /**
   * 达人路线鼓励的业务关联锚点（契约 §1 W7~W9）。
   * 传它时下单 body **不会**带 lineId（达人单落库 line_id IS NULL）。
   */
  expertRouteId?: number;
  tierCode: string;
  /** 阶段变更回调，供 UI 展示「正在创建订单/正在拉起支付/正在确认结果」 */
  onStage?: (stage: RewardPayStage) => void;
}

/** 归一化后的业务锚点：**只会含 lineId / expertRouteId 中的一个键** */
export type RewardAnchor = { lineId: number } | { expertRouteId: number };

/**
 * 把入参里的锚点值归一成「正整数 id」，其余一律按**没传**处理（返回 0）。
 *
 * <p>为什么不能只写 {@code Number(v || 0)}：那样 {@code -1} 是真值，会被当成合法锚点
 * 送进下单 body，后端按主键查不到归属 → 报「线路不存在」，排查方向直接被带偏；
 * 更糟的是 {@code { lineId: -1, expertRouteId: 9 }} 会被判成「两个都传」而抛参数冲突，
 * 掩盖了真实问题（其实是 lineId 没传）。
 *
 * <p>非整数（如 {@code 7.5}）同样按没传处理：后端主键是 BIGINT 自增正整数，
 * 任何别的形态都必然查不到，让它走「锚点缺失」的抛错分支比带假 id 出网更好定位。
 *
 * <p>⚠️ 字符串数字（{@code '9'}）**要接受**：小程序页面参数来自 URL query，
 * 拿到的天然是字符串，拒掉会让正常入口直接报「缺少业务关联锚点」。
 */
function toAnchorId(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

/**
 * 校验并归一化业务锚点。
 *
 * 「都传」和「都不传」都是**调用方的编程错误**，后端也一定拒单，所以在出网前就抛：
 * - 省掉一次必然失败的请求；
 * - 避免把参数拼装错误误当成支付渠道故障去排查（这类误判在真机联调时成本极高）；
 * - console.error 留现场，抛错让调用方的 catch 兜住 UI 状态（例如复位 paying 锁）。
 *
 * 0 / 负数 / 非整数 / 非数字一律等价于「没传」，见 {@link toAnchorId}。
 */
export function resolveRewardAnchor(
  options: Pick<PayLineRewardOptions, 'lineId' | 'expertRouteId'>,
): RewardAnchor {
  const lineId = toAnchorId(options?.lineId);
  const expertRouteId = toAnchorId(options?.expertRouteId);

  if (lineId && expertRouteId) {
    console.error('打赏锚点互斥：lineId 与 expertRouteId 不能同时传', {
      lineId,
      expertRouteId,
    });
    throw new Error('打赏参数冲突：线路与达人路线只能二选一');
  }
  if (!lineId && !expertRouteId) {
    console.error('打赏锚点缺失：lineId 与 expertRouteId 必须传其中一个', options);
    throw new Error('打赏参数缺失：缺少业务关联锚点');
  }
  return lineId ? { lineId } : { expertRouteId };
}

/**
 * 版本号比较（官方推荐实现）。
 * @returns v1>v2 返回 1，v1<v2 返回 -1，相等返回 0；入参非法返回 0
 */
export function compareVersion(v1: string, v2: string): number {
  if (typeof v1 !== 'string' || typeof v2 !== 'string') return 0;
  const a1 = v1.split('.');
  const a2 = v2.split('.');
  const len = Math.max(a1.length, a2.length);
  while (a1.length < len) a1.push('0');
  while (a2.length < len) a2.push('0');
  for (let i = 0; i < len; i += 1) {
    const n1 = parseInt(a1[i], 10) || 0;
    const n2 = parseInt(a2[i], 10) || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

function readSystemInfo(): { platform: string; sdkVersion: string } {
  try {
    const info = wx.getSystemInfoSync();
    return {
      platform: info.platform || 'unknown',
      sdkVersion: info.SDKVersion || '',
    };
  } catch (err) {
    console.error('读取系统信息失败:', err);
    return { platform: 'unknown', sdkVersion: '' };
  }
}

export function getPlatform(): string {
  return readSystemInfo().platform;
}

export function getSdkVersion(): string {
  return readSystemInfo().sdkVersion;
}

/**
 * 判定当前环境是否支持虚拟支付。
 *
 * 官方建议：基础库 >= 2.19.2 可直接用；低于该版本时用 wx.canIUse 兜底判断。
 * 另外 **devtools（开发者工具）不在后端 allow_platforms 白名单内**，
 * 工具里下单会被后端拒（4003），所以这里直接判为不支持，
 * 避免开发者在工具里看到入口却永远支付失败。
 */
export function checkVirtualPaymentCapability(): VirtualPaymentCapability {
  const { platform, sdkVersion } = readSystemInfo();

  if (platform === 'devtools') {
    return {
      supported: false,
      platform,
      sdkVersion,
      reason: '开发者工具内不支持虚拟支付，请用真机预览',
    };
  }

  if (SUPPORTED_PLATFORMS.indexOf(platform) < 0) {
    return {
      supported: false,
      platform,
      sdkVersion,
      reason: '当前设备暂不支持该功能',
    };
  }

  const versionOk = compareVersion(sdkVersion, MIN_SDK_VERSION) >= 0;
  const canIUse = typeof wx.canIUse === 'function' && wx.canIUse('requestVirtualPayment');
  if (!versionOk && !canIUse) {
    return {
      supported: false,
      platform,
      sdkVersion,
      reason: '微信版本过低，请升级后重试',
    };
  }

  return { supported: true, platform, sdkVersion };
}

/**
 * errCode 是否已被 describeVirtualPaymentError 收录。
 *
 * 未收录时才把原始 errCode/errMsg 暴露到界面上：已收录的码有准确文案，
 * 给用户看原始码只是噪声；未收录的码则相反——不给出来就彻底无法定位。
 */
export function isKnownVirtualPaymentError(errCode?: number): boolean {
  if (errCode === undefined || errCode === null) return false;
  const known = VPAY_ERR as unknown as Record<string, number>;
  return Object.keys(known).some((key) => known[key] === errCode);
}

/** errCode → 用户可读文案。未收录的码带上原始 errCode，避免联调时毫无线索。 */
export function describeVirtualPaymentError(errCode: number): string {
  switch (errCode) {
    case VPAY_ERR.USER_CANCEL:
      return '已取消';
    case VPAY_ERR.PAY_FAILED:
      return '支付失败，请稍后重试';
    case VPAY_ERR.RISK_CONTROL:
      return '交易被风控拦截，请稍后再试';
    case VPAY_ERR.SIGN_UNKNOWN:
      return '签约结果未知，请稍后在打赏记录中查看';
    case VPAY_ERR.PARAM_ERROR:
    case VPAY_ERR.SIGN_DATA_INVALID:
    case VPAY_ERR.PARAM_DETAIL:
    case VPAY_ERR.CURRENCY_INVALID:
      return '支付参数异常，请稍后重试';
    case VPAY_ERR.SIGNATURE_INVALID:
    case VPAY_ERR.PAY_SIG_INVALID:
      return '支付校验失败，请重新发起';
    case VPAY_ERR.SESSION_KEY_EXPIRED:
      return '登录状态已过期，请重试';
    case VPAY_ERR.GOODS_NOT_PUBLISHED:
    case VPAY_ERR.GOODS_NOT_EFFECTIVE:
      return '该档位正在生效中，请约 10 分钟后再试';
    case VPAY_ERR.PRICE_MISMATCH:
      return '档位价格已变更，请刷新后重试';
    case VPAY_ERR.ENV_INVALID:
      return '支付环境配置异常，请联系客服';
    case VPAY_ERR.TOO_FREQUENT:
    case VPAY_ERR.APP_RATE_LIMITED:
      return '操作过快，请稍候再试';
    case VPAY_ERR.DUPLICATE_OUT_TRADE_NO:
    case VPAY_ERR.MIDAS_CLOSED_ORDER:
      return '订单号已失效，请重新发起';
    case VPAY_ERR.MERCHANT_NOT_ENTERED:
      return '收款资质尚未生效，请稍后再试';
    case VPAY_ERR.MERCHANT_VIOLATION:
    case VPAY_ERR.MERCHANT_RESTRICTED:
      return '收款功能暂不可用，请联系客服';
    case VPAY_ERR.GOODS_AUDIT_REJECTED:
      return '该档位未通过审核，暂不可用';
    case VPAY_ERR.COIN_NOT_PUBLISHED:
      return '该档位尚未发布，请稍后再试';
    case VPAY_ERR.SYSTEM_ERROR:
      return '系统繁忙，请稍后重试';
    default:
      // 未收录的码：把原始 errCode 一并给出，否则真机联调毫无线索
      return `支付未完成（错误码 ${errCode}），请稍后在打赏记录中查看`;
  }
}

/** 后端业务码 → 用户可读文案 */
export function describeRewardBizError(code: number, fallback?: string): string {
  switch (code) {
    case REWARD_ERR.REWARD_DISABLED:
      return '打赏功能暂未开放';
    case REWARD_ERR.PLATFORM_UNSUPPORTED:
      return '当前设备暂不支持打赏';
    case REWARD_ERR.SDK_UNSUPPORTED:
      return '微信版本过低，请升级后重试';
    case REWARD_ERR.SESSION_KEY_INVALID:
      return '登录状态已过期，请重试';
    default:
      return fallback || '操作失败，请稍后重试';
  }
}

/**
 * 强制重新登录：清 token → wx.login 取 code → 调后端登录 → 写回 token。
 *
 * 与 utils/ensure-login 的区别：ensureLogin 在**已有 token 时直接返回 true**，
 * 无法处理「token 还在但后端 session_key 已失效（4001 / -15007）」的场景。
 * 打赏下单依赖后端持有的 session_key 计算用户态签名，session_key 失效时
 * 必须走一次完整的重新登录，否则重试多少次都是同样的失败。
 */
/**
 * 安全上报支付失败 —— **任何情况下都不得抛异常**。
 *
 * 上报是旁路观测通道，它挂掉（断网、后端 500、模块被替换、service 层实现有 bug）
 * 都绝不能影响用户看到的失败提示。调用点全部位于 catch 块内部，
 * 若这里再抛一次，异常会**从 catch 块里冒泡出去**，把原本的返回值一起吃掉，
 * 最终变成页面侧的 unhandled rejection：用户既看不到失败原因，我们也拿不到日志。
 *
 * 因此这里做双层兜底：service 层自己已 try/catch + `.catch()`，
 * 本函数再包一层，保证「上报永不抛」这条约束由调用方自己守住，
 * 不依赖被调用方的实现质量。
 */
function safeReportPayError(payload: {
  outTradeNo?: string;
  errCode?: number;
  errMsg?: string;
  platform?: string;
  tierCode?: string;
  sdkVersion?: string;
  stage?: string;
}): void {
  try {
    reportRewardPayError(payload);
  } catch (err) {
    // 只 warn 不抛：上报失败本身不值得打断用户，也不值得再上报一次（会递归）
    console.warn('支付失败上报异常，已忽略（不影响主流程）:', err);
  }
}

async function relogin(): Promise<boolean> {
  try {
    wx.removeStorageSync(TOKEN_KEY);
    const code = await wxLogin();
    const result = await login({ code });
    const newToken = (result as any)?.data?.token;
    if (newToken) {
      wx.setStorageSync(TOKEN_KEY, newToken);
      return true;
    }
    return false;
  } catch (err) {
    console.error('重新登录失败:', err);
    return false;
  }
}

/**
 * 拉起虚拟支付（回调转 Promise）。
 *
 * ⚠️ wx.requestVirtualPayment **不支持 Promise 风格**，只能手工包装。
 * ⚠️ 用户取消（-2）以 `{ cancelled: true }` **正常 resolve**，不 reject——
 *    取消是正常操作路径，不该进错误处理分支。
 *
 * ⚠️ **mode 是顶层必填参数**（官方示例：
 *    `wx.requestVirtualPayment({ signData, paySig, signature, mode: 'short_series_goods' })`），
 *    它**不在 signData 内部**。漏传不会报签名错，而是报参数类错误，
 *    且 errCode 容易落在未收录区间，排查成本极高——2026-09-30 真机联调踩过。
 */
export function requestVirtualPayment(params: {
  signData: string;
  paySig: string;
  signature: string;
  mode: string;
}): Promise<{ cancelled: boolean }> {
  return new Promise((resolve, reject) => {
    wx.requestVirtualPayment({
      // signData/paySig/signature 原样透传，signData 不做任何加工
      signData: params.signData,
      paySig: params.paySig,
      signature: params.signature,
      mode: params.mode,
      success: () => resolve({ cancelled: false }),
      // 整个入参对象做了 as any（部分基础库 typings 未收录 mode），
      // err 因此失去上下文类型，必须显式标注，否则 noImplicitAny 报 TS7006
      fail: (err: { errCode?: number; errMsg?: string }) => {
        if (err && err.errCode === VPAY_ERR.USER_CANCEL) {
          resolve({ cancelled: true });
          return;
        }
        // 原始 errCode/errMsg 必须落日志：errMsg 是 -15001 一类错误的唯一线索
        console.error('wx.requestVirtualPayment 失败:', err);
        const rawCode = err && err.errCode !== undefined ? err.errCode : 0;
        const error: VirtualPaymentError = new Error(
          describeVirtualPaymentError(rawCode),
        );
        error.errCode = err ? err.errCode : undefined;
        error.errMsg = err ? err.errMsg : undefined;
        reject(error);
      },
    } as any);
  });
}

/** 订单是否已到「已发货已记账」成功终态 */
function isOrderSettled(status?: string): boolean {
  return status === '2';
}

/** 订单是否已到失败/退款类终态（无需继续轮询） */
function isOrderFinal(status?: string): boolean {
  return status === '3' || status === '4' || status === '5' || status === '6';
}

/**
 * 轮询订单状态直到终态或超出尝试次数。
 *
 * 读到 '0'/'1' 不算失败：C 端查单接口只读本地库、不打微信 API
 * （防止任意用户刷光 query_order 的频率配额，连带吃掉补偿任务的配额）。
 * 微信发货推送或兜底补偿任务会在几分钟内把状态追平。
 *
 * 单次查询异常（网络抖动等）不中断轮询，继续下一次尝试。
 */
export async function pollRewardOrderStatus(
  outTradeNo: string,
  options?: { intervalMs?: number; maxAttempts?: number },
): Promise<RewardOrderStatusResult | null> {
  const intervalMs = options?.intervalMs ?? POLL_INTERVAL_MS;
  const maxAttempts = options?.maxAttempts ?? POLL_MAX_ATTEMPTS;
  let last: RewardOrderStatusResult | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    try {
      const res = await getRewardOrderStatus(outTradeNo);
      const data = res?.data;
      if (!data) continue;
      last = data;
      if (isOrderSettled(data.orderStatus) || isOrderFinal(data.orderStatus)) {
        return data;
      }
    } catch (err) {
      // 单次失败不终止轮询：utils/request 已弹过 toast，这里只记录
      console.warn('轮询打赏订单状态失败，将继续重试:', err);
    }
  }
  return last;
}

/**
 * 完整打赏流程：下单 → 拉起支付 → 轮询确认。
 *
 * 调用方给「lineId **或** expertRouteId」+ tierCode，其余（锚点互斥校验、终端判定、
 * 签名透传、session_key 失效重登重试、取消识别、结果确认）都在这里收敛。
 * 线路打赏与达人路线鼓励**共用这一条编排**（设计文档 §15.5 F1），差异只在下单 body 的锚点键。
 *
 * **不弹任何 toast**：结果以返回值交给调用方决定如何呈现，
 * 避免组件与页面重复提示。
 *
 * ⚠️ 锚点非法（都传 / 都不传）时**抛错**而不是返回 failed：那是编程错误，
 *    需要调用方的 catch 复位 UI 锁并留下堆栈，不能混进「支付失败」的用户文案里。
 */
export async function payLineReward(
  options: PayLineRewardOptions,
): Promise<RewardPayOutcome> {
  // 先校验锚点再加支付锁：参数非法时直接抛，不占锁、不出网
  resolveRewardAnchor(options);

  if (paying) {
    return { status: 'failed', message: '上一笔打赏正在处理中，请稍候' };
  }

  const capability = checkVirtualPaymentCapability();
  if (!capability.supported) {
    return { status: 'unsupported', message: capability.reason || '当前设备暂不支持' };
  }

  paying = true;
  try {
    return await invokeRewardPayment(options, capability);
  } finally {
    paying = false;
  }
}

/**
 * 实际执行体。单独抽出来是为了让 session_key 失效时的「重登 + 重试一次」
 * 能用循环表达，同时保证 paying 锁只在 payLineReward 里加减一次。
 */
async function invokeRewardPayment(
  options: PayLineRewardOptions,
  capability: VirtualPaymentCapability,
): Promise<RewardPayOutcome> {
  const { tierCode, onStage } = options;
  const anchor = resolveRewardAnchor(options);
  // 4001 / -15007 只重试一次：再多也只是重复失败，且会放大后端压力
  const maxOrderAttempts = 2;

  for (let attempt = 1; attempt <= maxOrderAttempts; attempt += 1) {
    onStage?.('creating-order');

    let order;
    try {
      const base = {
        tierCode,
        platform: capability.platform,
        sdkVersion: capability.sdkVersion,
      };
      // 只带一个锚点键：达人单不带 lineId，线路单不带 expertRouteId。
      // 不要图省事写成 { ...base, lineId, expertRouteId } —— 多出来的 undefined 键会改变
      // 下单 body 的形状（既有单测对 body 做了 deepStrictEqual 断言，后端也按互斥校验），
      // 而且 RewardOrderCreateParams 是判别联合，两个锚点同时出现在类型上就构造不出来。
      const orderParams: RewardOrderCreateParams =
        'expertRouteId' in anchor
          ? { ...base, expertRouteId: anchor.expertRouteId }
          : { ...base, lineId: anchor.lineId };
      const res = await createRewardOrder(orderParams);
      order = res?.data;
    } catch (err: any) {
      const code = err?.code;
      const sessionInvalid =
        code === REWARD_ERR.SESSION_KEY_INVALID || code === VPAY_ERR.SESSION_KEY_EXPIRED;
      if (sessionInvalid && attempt < maxOrderAttempts) {
        const ok = await relogin();
        if (ok) continue;
        return { status: 'failed', message: '登录状态已失效，请重新进入小程序' };
      }
      // 下单阶段失败同样上报：这一段的错误码是后端业务码（4001/4003/4042…），
      // 与微信侧 errCode 混在同一张日志表里才好还原完整时序
      safeReportPayError({
        errCode: code,
        errMsg: err?.message,
        platform: capability.platform,
        tierCode,
        sdkVersion: capability.sdkVersion,
        stage: 'creating-order',
      });
      return {
        status: 'failed',
        message: describeRewardBizError(code, err?.message),
        errCode: code,
      };
    }

    if (!order || !order.signData || !order.paySig || !order.signature || !order.mode) {
      // mode 缺失时绝不能静默降级：少了它微信必然报参数错误，且错误信息无法定位
      console.error('下单返回数据不完整:', order);
      safeReportPayError({
        outTradeNo: order?.outTradeNo,
        errMsg: '下单返回缺少 signData/paySig/signature/mode 之一',
        platform: capability.platform,
        tierCode,
        sdkVersion: capability.sdkVersion,
        stage: 'creating-order',
      });
      return { status: 'failed', message: '下单返回数据不完整，请稍后重试' };
    }

    onStage?.('invoking-payment');
    let cancelled = false;
    try {
      const result = await requestVirtualPayment({
        signData: order.signData,
        paySig: order.paySig,
        signature: order.signature,
        mode: order.mode,
      });
      cancelled = result.cancelled;
    } catch (err: any) {
      const errCode = err?.errCode;
      // 支付阶段报 session_key 问题：重登后重新下单（用户态签名依赖新的 session_key）。
      //
      // **-15005 和 -15007 一起纳入**：signature = HMAC(signData, session_key)，
      // 后端持有的 session_key 与微信当前值不一致时，微信过期报 -15007、签名对不上报 -15005，
      // 两者根因相同、处置动作也相同（重新 wx.login 换 session_key 再下一单）。
      // 官方错误码表对 -15005 的处置同样是「查 session_key 与算法」，故重登是正确的第一手动作。
      //
      // ⚠️ **不要把这段当成 2026-10-18 鸿蒙三连败的修复。** 那次故障经微信 `query_order`
      // 实证：三笔订单（orderId 17/18/19）在微信侧**确实存在且状态为 6（已关闭）**，
      // 说明 signData / paySig / signature 全部通过了微信校验、下单被正常受理，
      // session_key（当时已 70 小时未刷新）依然有效——失败发生在**拉起支付面板之后**，
      // 与签名无关。本改动只是把 -15005 这条**真实存在但那次没走到**的分支补齐，
      // 属于防御性覆盖，不解决那次故障。
      //
      // ⚠️ -15006（paySig 错误）**刻意不在**重登白名单里：paySig 用 AppKey 计算，
      // 与 session_key 无关，重登多少次都还是错的——那是配置/签名实现问题，必须让它显式失败。
      const sessionKeyStale =
        errCode === VPAY_ERR.SESSION_KEY_EXPIRED || errCode === VPAY_ERR.SIGNATURE_INVALID;
      if (sessionKeyStale && attempt < maxOrderAttempts) {
        const ok = await relogin();
        if (ok) continue;
      }
      // 这是整条链路里唯一能拿到微信原始 errCode/errMsg 的地方。
      // 不上报就等于把 -15001 的真实原因（只在 errMsg 里）永久丢弃，
      // 服务端只能看到一笔永远停在「待支付」的订单。
      safeReportPayError({
        outTradeNo: order.outTradeNo,
        errCode,
        errMsg: err?.errMsg,
        platform: capability.platform,
        tierCode,
        sdkVersion: capability.sdkVersion,
        stage: 'invoking-payment',
      });
      return {
        status: 'failed',
        message: describeVirtualPaymentError(errCode),
        errCode,
        errMsg: err?.errMsg,
      };
    }

    if (cancelled) {
      // ── 观测补盲（2026-10-18 鸿蒙三连败 orderId=17/18/19）────────────────────
      // 那三笔在服务端**一条上报都没有**，微信侧却是「订单存在 + status=6 已关闭
      // + 无 wxpay_order_id」，查单补偿只能在 34 分钟后写一句「微信侧已关闭，本地状态对齐」。
      // 复盘结论：上报原先只挂在 requestVirtualPayment **抛异常**的分支上，
      // 而 `cancelled` 与下面的 `pending` / `已关闭` 三条路径**完全静默**——
      // 这正是「日志都有却看不出原因」的根因，而不是微信没给线索。
      //
      // ⚠️ cancelled 在客户端**无法区分**两种情况：用户真的点了取消，
      //    以及微信侧拉起支付面板失败后自动关单（官方 -15012「调米大师失败导致关单」
      //    正是以「秒级关单 + 无 wxpay_order_id」呈现）。既然分不清就一律留痕，
      //    靠服务端日志里的「阶段=payment-cancelled」与真正的 fail 分支区分。
      //
      // ⚠️ 这**不改变任何返回语义**：取消依旧返回 'cancelled'、依旧不轮询、
      //    用户看到的文案一个字都不变。加的只是一条 fire-and-forget 旁路日志。
      safeReportPayError({
        outTradeNo: order.outTradeNo,
        errCode: VPAY_ERR.USER_CANCEL,
        errMsg: '微信回调 cancelled（-2）：用户主动取消，或微信侧拉起支付失败后自动关单，客户端无法区分',
        platform: capability.platform,
        tierCode,
        sdkVersion: capability.sdkVersion,
        stage: 'payment-cancelled',
      });
      return { status: 'cancelled' };
    }

    // 支付已受理，但**最终结果以服务端为准**
    onStage?.('confirming');
    const finalOrder = await pollRewardOrderStatus(order.outTradeNo);
    onStage?.('done');

    if (finalOrder && isOrderSettled(finalOrder.orderStatus)) {
      return { status: 'success', order: finalOrder };
    }
    if (finalOrder && finalOrder.orderStatus === '3') {
      // 微信说支付已受理（没走 fail、也没 cancelled），本地却读到「已关闭」——
      // 这是全链路最该被看见的一条：钱可能已扣而单被关，只能靠 query_order 定性。
      // 静默返回 failed 等于把唯一线索丢掉，用户只会看到一句「订单已关闭」。
      safeReportPayError({
        outTradeNo: order.outTradeNo,
        errMsg: '支付已受理但轮询读到本地 orderStatus=3（已关闭），需人工查 query_order 确认微信侧是否已扣款',
        platform: capability.platform,
        tierCode,
        sdkVersion: capability.sdkVersion,
        stage: 'confirming-closed',
      });
      return { status: 'failed', message: '订单已关闭，请重新发起' };
    }
    if (finalOrder && isOrderFinal(finalOrder.orderStatus)) {
      return { status: 'failed', message: '该笔打赏已进入退款流程，请在打赏记录中查看' };
    }

    // 仍是 0/1（或压根没读到）：对**用户**是正常现象，微信发货推送或兜底任务会在几分钟内追平。
    // 但对**排障**不是：走到这里说明「微信客户端认为支付已受理，我方账面却还没记账」，
    // 这正是「用户说付了、后台显示待支付」那类客诉的唯一现场。
    // 取舍：接受一定日志噪声（文案已明确标注「非失败」），换取资金链路不再有静默分支。
    safeReportPayError({
      outTradeNo: order.outTradeNo,
      errMsg: finalOrder
        ? `非失败：支付已受理，轮询 ${POLL_MAX_ATTEMPTS} 次后本地 orderStatus=${finalOrder.orderStatus}，`
          + '等微信发货推送或查单补偿追平；若长时间不追平需查 query_order'
        : `非失败：支付已受理，但轮询 ${POLL_MAX_ATTEMPTS} 次均未取到订单状态（查单接口异常），无法确认结果`,
      platform: capability.platform,
      tierCode,
      sdkVersion: capability.sdkVersion,
      stage: finalOrder ? 'confirming-pending' : 'confirming-noresult',
    });
    return {
      status: 'pending',
      outTradeNo: order.outTradeNo,
      message: '支付已受理，正在确认结果，可稍后在「我的打赏」中查看',
    };
  }

  return { status: 'failed', message: '打赏未完成，请稍后重试' };
}
