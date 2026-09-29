/**
 * C端线路类型 — 对应后端 WxLineVO
 *
 * ⚠️ 后端对 C 端做了字段裁剪，**不会**返回 merchantId / authorUserId /
 * androidShareRate / iosShareRate 等内部经营字段，这里也不要加。
 */

/** 线路关联的景点（已剔除全盲惊喜景点） */
export interface LineAttraction {
  attractionId: number;
  attractionName: string;
  /** 经典指数 */
  classicRating?: string;
  /** 建议游玩时长 */
  visitDuration?: string;
}

export interface TravelLineVO {
  lineId: number;
  lineName: string;
  province?: string;
  city?: string;
  district?: string;
  /**
   * 是否开启打赏：'0' 关闭 / '1' 开启。
   * 为 '0' 时必须**完全隐藏**打赏入口，不能置灰——置灰会让用户以为功能坏了。
   */
  rewardEnabled?: string;
  /** 作者昵称，后端保证非空（三级兜底：sys_user 昵称 → 商户名 → "线路作者"） */
  authorName?: string;
  /** 商户名，仅审核通过且状态正常时返回 */
  merchantName?: string | null;
  /** 封面图，取线路附件首图 */
  coverImage?: string | null;
  /** 线路简介 */
  remark?: string;
  /**
   * 可见景点数量。
   * ⚠️ **仅详情接口返回**；列表接口为 null（避免 N+1 查询），列表卡片不要依赖它。
   */
  attractionCount?: number | null;
  createTime?: string;
  /** 景点明细，仅详情接口返回 */
  attractions?: LineAttraction[] | null;
}

export interface LineListParams {
  keyword?: string;
  province?: string;
  city?: string;
  district?: string;
  pageNum?: number;
  pageSize?: number;
}
