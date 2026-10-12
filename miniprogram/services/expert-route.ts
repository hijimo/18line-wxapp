import request from '../utils/request';
import type {
  ExpertRouteListItem,
  ExpertRouteListParams,
  ExpertRouteDetail,
  ExpertRouteFavoriteResult,
  ExpertRouteCreateItineraryResult,
  ExpertRewardEntryVO,
} from '../types/expert-route';
import type { AjaxResult, TableDataInfo, PageParams } from '../types/common';

/**
 * 达人推荐路线（内容域）接口封装 —— W1~W6。
 *
 * 契约：docs/contracts/expert-route-api-v1.md §1
 *
 * ⚠️ 本文件**只管内容域**，绝不碰支付：
 *    鼓励（打赏）走既有 services/reward.ts + utils/virtual-payment.ts，
 *    达人侧只是多传一个与 lineId 互斥的 expertRouteId 锚点（§15.5 F1）。
 */

/**
 * 行程详情页「鼓励入口」探测（W6）的前端开关。
 *
 * 探测请求已带 `silent: true`（见 getExpertRewardEntry），失败不再弹 toast，
 * 因此**后端未部署也不会污染既有行程详情页**，本开关默认保持 true。
 * 仅在需要彻底断掉这次探测（例如排查干扰）时才置 false；置 false 后
 * e2e 用例「鼓励入口正向渲染」会因无请求而失败，需同步调整。
 * 达人 tab / 达人路线详情 / 我喜欢的路线 三页不受此开关影响——它们自带错误态与重试入口。
 */
export const EXPERT_REWARD_ENTRY_PROBE_ENABLED = true;

/** W1 达人路线列表（分页）。只返回 audit_status='1' AND status='0' AND del_flag='0' */
export const getExpertRouteList = (params?: ExpertRouteListParams) =>
  request<TableDataInfo<ExpertRouteListItem>>('/wx/expert-route/list', { data: params });

/**
 * W2 达人路线详情。
 *
 * ⚠️ 遮挡态（displayMode='locked'）景点的敏感字段由**服务端直接不下发**，
 *    前端不得自行「补全」，也不得把 locked 项的 name/description/attachments 渲染出来。
 * 未审核通过 / 已下架 / 已删除 → 后端抛 ServiceException("达人路线不存在")。
 */
export const getExpertRouteDetail = (routeId: number) =>
  request<AjaxResult<ExpertRouteDetail>>(`/wx/expert-route/${routeId}`);

/**
 * W3 收藏 / 取消收藏（**幂等**：重复收藏、取消不存在的收藏都返回成功）。
 * @param favorited true=收藏，false=取消（取消是物理删除）
 */
export const toggleExpertRouteFavorite = (routeId: number, favorited: boolean) =>
  request<AjaxResult<ExpertRouteFavoriteResult>>(
    `/wx/expert-route/${routeId}/favorite`,
    { method: 'POST', data: { favorited } },
  );

/** W4 我收藏的达人路线（分页）。未登录 → ERR_SESSION_KEY_INVALID；空列表返回 total:0 而不是报错 */
export const getExpertRouteFavorites = (params?: PageParams) =>
  request<TableDataInfo<ExpertRouteListItem>>('/wx/expert-route/favorites', {
    data: params,
  });

/**
 * W5 用达人路线创建行程。
 *
 * @param travelDate 出行日期 `yyyy-MM-dd`，**非必填**；不填时传 null（后端按无日期建行程）
 * 服务端同一路线可重复创建多条行程（换日期重走是合法的），**不做幂等**，
 * 所以防连点必须由前端做（页面侧 creating 锁）。
 */
export const createItineraryFromExpertRoute = (
  routeId: number,
  travelDate?: string | null,
) =>
  request<AjaxResult<ExpertRouteCreateItineraryResult>>(
    `/wx/expert-route/${routeId}/create-itinerary`,
    { method: 'POST', data: { travelDate: travelDate || null } },
  );

/**
 * W6 行程详情页的鼓励入口探测。
 *
 * 该行程不是达人路线创建的 / 行程不属于当前用户 / 闸门未过 → `available:false`（**不报错**）。
 * 调用方必须按 available 决定「渲染入口」还是「渲染空」，不要拿 blockReason 当判定依据。
 */
/**
 * @param itineraryId 行程ID（必填）
 * @param platform    终端（`wx.getSystemInfoSync().platform`）。
 *   ⚠️ **强烈建议传**：服务端 `loadTiers(platform)` 在 platform 为空时返回**空档位列表**
 *   （不是「全平台档位」），此时 `available` 仍为 true 但 `tiers` 为 `[]` ——
 *   典型的「静默空结果」。当前 `reward-panel` 自己调 `GET /wx/reward/tiers?platform=` 取档位，
 *   所以面板不受影响；但一旦有人改成直接用 `entry.tiers` 渲染，档位就会全空且不报错。
 */
export const getExpertRewardEntry = (itineraryId: number, platform?: string) =>
  request<AjaxResult<ExpertRewardEntryVO>>('/wx/expert-route/reward-entry', {
    // 用条件展开而不是 `platform: platform || undefined`：
    // undefined 值仍会出现在 query 对象里，序列化后可能变成 `platform=undefined` 字符串
    data: platform ? { itineraryId, platform } : { itineraryId },
    // 探测类接口：失败静默，页面按 available=false 渲染空即可，不打扰用户
    silent: true,
  });
