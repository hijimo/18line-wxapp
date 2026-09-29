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

/** 创建打赏订单入参 */
export interface RewardOrderCreateParams {
  /** 线路ID — 打赏的业务关联锚点 */
  lineId: number;
  tierCode: string;
  /** wx.getSystemInfoSync().platform：android/ios/windows/harmony/devtools */
  platform: string;
  /** 基础库版本，后端用于校验是否 >= 2.19.2 */
  sdkVersion?: string;
}

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
   * 注意：官方 API 的 mode 在 **signData 内部**，顶层不需要传，
   * 本字段仅供前端展示/日志排查使用。
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
  lineId?: number;
  paidTime?: string | null;
}

/** 我的打赏记录行 */
export interface RewardOrderRecord {
  orderId?: number;
  orderNo?: string;
  outTradeNo?: string;
  lineId?: number;
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
export const VPAY_ERR = {
  PARAM_ERROR: 1001,
  PAY_FAILED: -1,
  /** 用户主动取消，**不是异常**，不要弹错误提示 */
  USER_CANCEL: -2,
  RISK_CONTROL: -4,
  SIGN_UNKNOWN: -5,
  SIGNATURE_INVALID: -15005,
  PAY_SIG_INVALID: -15006,
  /** session_key 过期，需重新 wx.login */
  SESSION_KEY_EXPIRED: -15007,
  GOODS_NOT_PUBLISHED: -15010,
  ENV_INVALID: -15011,
  PRICE_MISMATCH: -15013,
  /** 道具发布未生效，约 10 分钟后可用 */
  GOODS_NOT_EFFECTIVE: -15014,
  SIGN_DATA_INVALID: -15016,
  TOO_FREQUENT: -15020,
} as const;
