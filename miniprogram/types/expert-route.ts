/**
 * 达人推荐路线类型 — 对应后端 /wx/expert-route/** 的 VO
 *
 * 契约来源（**唯一真相源**）：docs/contracts/expert-route-api-v1.md §1（W1~W6）
 * 设计文档：docs/architecture/expert-route-design.md §14.11 / §15.5
 *
 * ⚠️ 本文件只覆盖**内容域**。鼓励（打赏）相关的类型仍在 types/reward.ts，
 *    达人侧只是给 RewardOrderCreateParams 多了一个互斥锚点 expertRouteId。
 */

/**
 * 景点展示模式，由服务端按 travel_attraction.blind_status **实时**判定后下发：
 * - `visible`：全明，下发名称/描述/真实坐标/附件
 * - `locked`：遮挡（盲景点），**敏感字段直接不下发**，只剩文字 hint
 *   （stationLabel / attractionBlurb / indoorOutdoor / visitDuration / attractionNotes /
 *    classicRating / leisureRating / expertIntro）
 *
 * 前端不做任何盲态推断，一律以 displayMode 为准。
 */
export type ExpertAttractionDisplayMode = 'visible' | 'locked';

/** W2 `days[].attractions[]` */
export interface ExpertRouteAttractionItem {
  attractionId: number;
  /** 同一天内的排序，升序 */
  sortOrder?: number;
  displayMode: ExpertAttractionDisplayMode;

  // ================= visible / locked **都下发** =================

  /**
   * 达人对这个景点的介绍（§13.5）。
   * **locked 态也会下发**，是遮挡卡上的正文内容。
   */
  expertIntro?: string | null;

  /**
   * 服务端算好的「第N站」标签（按天内 sort_order 生成）。
   * 前端直接展示，**不要**自己用下标重算——重算会与服务端口径不一致。
   */
  stationLabel?: string | null;

  /** 一句话吊胃口文案（= 行程页 locked 卡的 fuzzyDescription） */
  attractionBlurb?: string | null;
  /** 室内 / 室外（= 行程页 locked 卡的 categoryHint） */
  indoorOutdoor?: string | null;
  /** 建议游玩时长（= 行程页 locked 卡的 durationHint） */
  visitDuration?: string | null;
  /** 出行准备提示（= 行程页 locked 卡的 prepHint），没有数据时为 null */
  attractionNotes?: string | null;
  /** 经典指数 */
  classicRating?: string | null;
  /** 休闲指数 */
  leisureRating?: string | null;

  // ================= 仅 visible 下发；locked 态一律 null / 缺省 =================

  attractionName?: string | null;
  attractionShortName?: string | null;
  attractionDescription?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  attachments?: Record<string, any>[] | null;
  openTime?: string | null;
  bestViewingTime?: string | null;
  ticketPriceA?: number | null;
  ticketPriceC?: number | null;

  /**
   * 模糊坐标：**仅 visible 态可能下发**。
   *
   * ⚠️ 遮挡态一个坐标都不下发（契约 W2 的 ⚠️ 框、设计文档 §13.5 与 :911）：
   *    达人路线详情页没有「导航前往 + 到达解锁」交互，下发模糊坐标等于给爬虫一份
   *    近似位置数据库。所以 locked 分支**不得**渲染坐标、不得画模糊圈，也不要为
   *    「坐标缺失」写兜底文案——后端本来就不给，写了会让人以为接口坏了。
   */
  fuzzyLongitude?: number | null;
  fuzzyLatitude?: number | null;
  fuzzyRadius?: number | null;
}

/** W2 `days[]` */
export interface ExpertRouteDayVO {
  routeDayId: number;
  /** 第几天，从 1 开始 */
  dayIndex: number;
  /** 当天主题 */
  dayTheme?: string | null;
  /** 当天方案说明 */
  dayIntro?: string | null;
  /**
   * 6 个资源的**展示名**（批次 1 恒为 null，批次 2 才有值）。
   * 前端按「有值才渲染」处理，不要为 null 留空行。
   */
  accommodationName?: string | null;
  breakfastName?: string | null;
  lunchName?: string | null;
  dinnerName?: string | null;
  carNickname?: string | null;
  photographyNickname?: string | null;
  attractions?: ExpertRouteAttractionItem[] | null;
}

/** W1 / W4 列表行 */
export interface ExpertRouteListItem {
  routeId: number;
  routeTitle: string;
  /** 瀑布流封面，可能为 null（前端用标题首字兜底） */
  coverUrl?: string | null;
  authorNickname?: string | null;
  authorAvatar?: string | null;
  /**
   * 地区**名称**（RegionNameResolver 解析后的中文），不是 6 位编码。
   * ⚠️ 契约 B6：任何情况下都不要把 province/city/district 编码直接显示给用户。
   */
  regionName?: string | null;
  dayCount?: number;
  attractionCount?: number;
  /** 收藏数，服务端聚合查询（无冗余列） */
  favoriteCount?: number;
  /** 当前登录用户是否已收藏；未登录恒 false */
  favorited?: boolean;
  /** 卡片副文案 */
  intro?: string | null;
  /** 该路线当前是否可被鼓励（下单闸门 G1~G5 的结果，前端只展示不判定） */
  rewardAvailable?: boolean;
  createTime?: string;
}

/** W2 详情 */
export interface ExpertRouteDetail extends ExpertRouteListItem {
  /** 路线级鼓励开关（reward_enabled） */
  rewardEnabled?: boolean;
  /** rewardAvailable=false 时的可读原因，仅展示用，服务端仍会强校验 */
  rewardBlockReason?: string | null;
  days?: ExpertRouteDayVO[] | null;
}

/** W1 查询参数 */
export interface ExpertRouteListParams {
  pageNum?: number;
  pageSize?: number;
  /** 6 位城市编码，可选 */
  cityCode?: string;
  /** 标题模糊搜索，可选 */
  keyword?: string;
}

/** W3 返回体 */
export interface ExpertRouteFavoriteResult {
  favorited: boolean;
  favoriteCount: number;
}

/** W5 返回体 */
export interface ExpertRouteCreateItineraryResult {
  itineraryId: number;
  itineraryTitle: string;
}

/** W6 `tiers[]`（复用既有档位；实际支付档位由 reward-panel 自己调 /wx/reward/tiers 拉取） */
export interface ExpertRewardEntryTier {
  tierCode: string;
  tierName: string;
  priceFen: number;
  isTest?: string | boolean;
  sortOrder?: number;
}

/** W6 返回体 */
export interface ExpertRewardEntryVO {
  /**
   * false 时前端**渲染空**：不留空壳、不占位、不报错。
   * 非达人创建的行程、越权访问、闸门未过，都是 available=false。
   */
  available: boolean;
  blockReason?: string | null;
  routeId?: number | null;
  routeTitle?: string | null;
  authorNickname?: string | null;
  authorAvatar?: string | null;
  itineraryId?: number | null;
  tiers?: ExpertRewardEntryTier[] | null;
}
