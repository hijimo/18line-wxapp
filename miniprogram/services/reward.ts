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
 */
export const createRewardOrder = (params: RewardOrderCreateParams) =>
  request<AjaxResult<RewardOrderCreateResult>>('/wx/reward/order', {
    method: 'POST',
    data: params,
  });

/**
 * 我的打赏记录（分页）。
 * @param lineId 可选，按线路过滤
 */
export const getMyRewardOrders = (params?: { lineId?: number; pageNum?: number; pageSize?: number }) =>
  request<TableDataInfo<RewardOrderRecord>>('/wx/reward/orders', { data: params });

/**
 * 查询单笔订单状态 — **支付后轮询用**。
 *
 * ⚠️ 该接口只读本地库、不调微信 query_order（避免 C 端把微信的频率配额刷光，
 * 连带吃掉补偿任务的配额）。所以支付后短时间内读到「待支付」是**正常现象**，
 * 微信发货推送或兜底补偿任务会在几分钟内追平，不要据此判定支付失败。
 */
export const getRewardOrderStatus = (outTradeNo: string) =>
  request<AjaxResult<RewardOrderStatusResult>>(`/wx/reward/order/${outTradeNo}`);
