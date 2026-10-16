import request from '../utils/request';
import type {
  RewardTier,
  RewardOrderCreateParams,
  RewardOrderCreateResult,
  RewardOrderStatusResult,
  RewardOrderRecord,
} from '../types/reward';
import type { AjaxResult, TableDataInfo } from '../types/common';

/**
 * 查询可用打赏档位。
 *
 * 后端已做双重过滤（allow_platforms + iOS 最低价 1 元），前端不需要再筛。
 * **总开关关闭时返回空数组**，前端据此隐藏打赏入口——这是产品约定的
 * 「功能未开放就不露出」策略，不要改成展示后置灰。
 */
export const getRewardTiers = (platform: string) =>
  request<AjaxResult<RewardTier[]>>('/wx/reward/tiers', { data: { platform } });

/**
 * 创建打赏订单，返回拉起 wx.requestVirtualPayment 所需的签名参数。
 *
 * ⚠️ 返回的 signData 是后端序列化好的字符串，**禁止**二次 JSON.stringify。
 * ⚠️ params.lineId 与 params.expertRouteId **互斥且必填其一**；调用方不要自己拼，
 *    统一走 utils/virtual-payment.ts 的 payLineReward（它会在出网前校验）。
 */
export const createRewardOrder = (params: RewardOrderCreateParams) =>
  request<AjaxResult<RewardOrderCreateResult>>('/wx/reward/order', {
    method: 'POST',
    data: params,
  });

/**
 * 我的打赏记录（分页）。
 *
 * @param lineId 可选，按线路过滤；为 0 / 缺省时**不传该字段**，表示查全部
 * @param expertRouteId 可选，按达人路线过滤；同上，为 0 / 缺省时不传
 *
 * ⚠️ 两个过滤参数都不要写成 `x || undefined` 之外的形态：wx.request 会把 undefined
 *    拼成字面量 "undefined"，后端 Long 转换失败直接 400（utils/request 已统一剔除 undefined）。
 */
export const getMyRewardOrders = (params?: {
  lineId?: number;
  expertRouteId?: number;
  pageNum?: number;
  pageSize?: number;
}) =>
  request<TableDataInfo<RewardOrderRecord>>('/wx/reward/orders', { data: params });

/**
 * 上报虚拟支付失败 — **纯观测通道，只写服务端日志**。
 *
 * ⚠️ 为什么必须有这个接口：`wx.requestVirtualPayment` 的失败由微信客户端直接回调给
 * 小程序，**完全不经过我们的服务器**。真机支付失败时服务端日志一片空白，运维只能看到
 * 「订单创建了却一直待支付」，无从判断是用户取消、道具未发布、签名错误还是价格不符；
 * 而 `-15001`（参数错误）的**具体原因只存在于 errMsg 里**，丢掉它就等于丢掉唯一定位线索。
 *
 * ⚠️ 调用方必须 fire-and-forget：本接口失败绝不能影响支付主流程，
 * 所以内部吞掉所有异常、不 await 结果、不抛出。
 */
export const reportRewardPayError = (payload: {
  outTradeNo?: string;
  errCode?: number;
  errMsg?: string;
  platform?: string;
  tierCode?: string;
  sdkVersion?: string;
  stage?: string;
}) => {
  try {
    // 不 await：上报是旁路，不能拖慢或阻塞用户看到的失败提示
    void request<AjaxResult<null>>('/wx/reward/pay-error', {
      method: 'POST',
      data: payload,
    }).catch((err: unknown) => {
      console.warn('支付失败上报未送达（不影响主流程）:', err);
    });
  } catch (err) {
    console.warn('支付失败上报异常（不影响主流程）:', err);
  }
};

/**
 * 查询单笔订单状态 — **支付后轮询用**。
 *
 * ⚠️ 该接口只读本地库、不调微信 query_order（避免 C 端把微信的频率配额刷光，
 * 连带吃掉补偿任务的配额）。所以支付后短时间内读到「待支付」是**正常现象**，
 * 微信发货推送或兜底补偿任务会在几分钟内追平，不要据此判定支付失败。
 */
export const getRewardOrderStatus = (outTradeNo: string) =>
  request<AjaxResult<RewardOrderStatusResult>>(`/wx/reward/order/${outTradeNo}`);
