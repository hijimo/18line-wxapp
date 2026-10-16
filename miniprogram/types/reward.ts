/**
 * 线路打赏类型 — 对应后端 /wx/reward/** 的 DTO/VO
 *
 * 契约来源：travel18 RewardTierVO / RewardOrderCreateDTO / RewardOrderCreateVO，
 * 以及设计文档 docs/architecture/virtual-payment-reward-design.md §11.1。
 */

/** 打赏档位（对应微信虚拟支付的「道具」） */
export interface RewardTier {
  /** 档位业务码，如 T001，下单时传这个而不是道具ID */
  tierCode: string;
  /** 档位名称，如「鼓励一下」 */
  tierName: string;
  /** 金额（分） */
  priceFen: number;
  /** 金额（元），后端已格式化，直接展示用 */
  priceYuan: string;
  sortOrder?: number;
  /** 是否测试档位：'0' 正式 / '1' 测试，前端据此加「测试」角标 */
  isTest?: string;
}

/**
 * 创建打赏订单入参的公共部分（档位 + 终端信息）。
 * 抽出来是为了让下面两个锚点分支共享同一份字段定义，避免「加字段只加了一边」的漂移。
 */
interface RewardOrderCreateBase {
  tierCode: string;
  /**
   * wx.getSystemInfoSync().platform 原值透传。
   *
   * 微信官方合法值：android / ios / ohos（鸿蒙手机）/ ohos_pc（鸿蒙 PC）/ windows / mac / devtools。
   * **鸿蒙是 ohos，不存在 harmony。** 后端只放行 android/ios/ohos/ohos_pc/windows，其余回 4003。
   */
  platform: string;
  /** 基础库版本，后端用于校验是否 >= 2.19.2 */
  sdkVersion?: string;
}

/**
 * 线路打赏：锚点是商家线路 `lineId`。
 *
 * `expertRouteId?: never` 是**刻意**的：它让「两个锚点都带」在编译期就是错误，
 * 而不是等到后端拒单才发现。
 */
export interface LineRewardOrderCreateParams extends RewardOrderCreateBase {
  /** 线路ID — 线路打赏的业务关联锚点 */
  lineId: number;
  expertRouteId?: never;
}

/**
 * 达人路线鼓励：锚点是达人路线 `expertRouteId`，此时达人单 `line_id` 落库为 NULL。
 */
export interface ExpertRewardOrderCreateParams extends RewardOrderCreateBase {
  /** 达人路线ID — 达人鼓励的业务关联锚点 */
  expertRouteId: number;
  lineId?: never;
}

/**
 * 创建打赏订单入参（契约 §1 W7~W9）。
 *
 * ⚠️ **lineId 与 expertRouteId 互斥且必填其一**，这里用**判别联合**表达：
 *    - 线路打赏：只带 lineId
 *    - 达人路线鼓励：只带 expertRouteId
 *    两个都带或都不带在类型层面就构造不出来；运行时还有
 *    `utils/virtual-payment.ts` 的 `resolveRewardAnchor` 兜第二道（入参可能来自
 *    页面 query 字符串，类型系统管不到），后端拒单是第三道。
 */
export type RewardOrderCreateParams =
  | LineRewardOrderCreateParams
  | ExpertRewardOrderCreateParams;

/**
 * 创建打赏订单返回体。
 *
 * ⚠️ signData 是**后端已序列化的字符串**，必须原样传给 wx.requestVirtualPayment。
 * 重新 JSON.stringify 会改变字段顺序/空格导致签名失效（errCode -15006）。
 */
export interface RewardOrderCreateResult {
  /** 18线内部订单号 */
  orderNo: string;
  /** 微信业务订单号，支付后轮询查单用 */
  outTradeNo: string;
  signData: string;
  paySig: string;
  signature: string;
  /**
   * 支付模式（short_series_goods）。
   *
   * ⚠️ mode 是 wx.requestVirtualPayment 的**顶层必填参数**，不在 signData 内部。
   * 官方文档的参数表把 mode 列在 signData 结构里、顶层参数表又漏列，两处自相矛盾；
   * 但同页**示例代码**明确是 `wx.requestVirtualPayment({ signData, paySig, signature, mode })`，
   * 且示例的 signData 里并不含 mode —— 以可执行的示例代码为准。
   * 漏传 mode 会被微信判为参数错误（-15001 一类），且不会报签名错，极易误判。
   */
  mode: string;
  tierName: string;
  /** 实付金额（分） */
  actualPriceFen: number;
}

/**
 * 本地订单状态（order_status），对应 RewardConstants.ORDER_STATUS_*
 *
 * | 值 | 含义 | 前端处理 |
 * |---|---|---|
 * | 0 | 待支付 | 继续轮询 |
 * | 1 | 已支付待发货 | 继续轮询 |
 * | 2 | 已发货已记账 | **成功终态**，停止轮询 |
 * | 3 | 已关闭 | 失败终态（超时未支付） |
 * | 4 | 退款中 | 终态，提示退款处理中 |
 * | 5 | 已退款 | 终态 |
 * | 6 | 退款失败 | 终态，需人工介入 |
 */
export type RewardOrderStatus = '0' | '1' | '2' | '3' | '4' | '5' | '6';

/** 单笔订单状态查询结果（轮询用） */
export interface RewardOrderStatusResult {
  orderNo: string;
  outTradeNo: string;
  orderStatus: RewardOrderStatus;
  tierId?: number;
  actualPriceFen?: number;
  /** 线路单有值；达人单为 null */
  lineId?: number | null;
  /** 达人鼓励单有值；线路单为 null（前端据此决定跳哪个详情页） */
  expertRouteId?: number | null;
  paidTime?: string | null;
}

/** 我的打赏记录行 */
export interface RewardOrderRecord {
  orderId?: number;
  orderNo?: string;
  outTradeNo?: string;
  /** 线路单有值；达人鼓励单为 null */
  lineId?: number | null;
  /** 达人鼓励单有值；线路单为 null。⚠️ 两者都为空时前端**不得**跳任何详情页 */
  expertRouteId?: number | null;
  orderStatus?: RewardOrderStatus;
  tierName?: string;
  actualPriceFen?: number;
  platform?: string;
  createTime?: string;
  paidTime?: string | null;
}

/** 业务错误码，对应 RewardConstants.ERR_* */
export const REWARD_ERR = {
  /** session_key 失效，需重新 wx.login 后重试下单 */
  SESSION_KEY_INVALID: 4001,
  /** 打赏功能未开启（总开关或线路级关闭） */
  REWARD_DISABLED: 4002,
  /** 当前终端不支持 */
  PLATFORM_UNSUPPORTED: 4003,
  /** 基础库版本过低（< 2.19.2） */
  SDK_UNSUPPORTED: 4004,
} as const;

/** wx.requestVirtualPayment 的关键 errCode */
/**
 * wx.requestVirtualPayment 错误码 —— 与官方文档错误表**逐条对齐**（2026-09-30 核对）。
 *
 * 收录必须完整：describeVirtualPaymentError 的 default 分支只会给一句
 * 「支付未完成，请稍后在打赏记录中查看」，漏收的码会让真机联调彻底失去线索
 * （本次 mode 漏传就是因为 errCode 落在 default 分支才难定位）。
 */
export const VPAY_ERR = {
  PARAM_ERROR: 1001,
  PAY_FAILED: -1,
  /** 用户主动取消，**不是异常**，不要弹错误提示 */
  USER_CANCEL: -2,
  RISK_CONTROL: -4,
  SIGN_UNKNOWN: -5,
  /** 参数错误，具体原因只在 errMsg 里，必须把 errMsg 一起透出 */
  PARAM_DETAIL: -15001,
  /** outTradeNo 重复使用，必须换新单号 */
  DUPLICATE_OUT_TRADE_NO: -15002,
  SYSTEM_ERROR: -15003,
  CURRENCY_INVALID: -15004,
  SIGNATURE_INVALID: -15005,
  PAY_SIG_INVALID: -15006,
  /** session_key 过期，需重新 wx.login */
  SESSION_KEY_EXPIRED: -15007,
  /** 二级商户进件未完成 */
  MERCHANT_NOT_ENTERED: -15008,
  COIN_NOT_PUBLISHED: -15009,
  GOODS_NOT_PUBLISHED: -15010,
  ENV_INVALID: -15011,
  /** 调米大师失败导致关单，需换新单号 */
  MIDAS_CLOSED_ORDER: -15012,
  PRICE_MISMATCH: -15013,
  /** 道具发布未生效，约 10 分钟后可用 */
  GOODS_NOT_EFFECTIVE: -15014,
  SIGN_DATA_INVALID: -15016,
  /** 商家涉嫌违规，收款被限制 */
  MERCHANT_VIOLATION: -15017,
  /** 道具/代币审核不通过 */
  GOODS_AUDIT_REJECTED: -15018,
  /** 微信报商户受限 */
  MERCHANT_RESTRICTED: -15019,
  TOO_FREQUENT: -15020,
  /** 小程序被限频交易 */
  APP_RATE_LIMITED: -15021,
} as const;
