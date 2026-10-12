import {
  createItineraryFromExpertRoute,
  getExpertRouteDetail,
  toggleExpertRouteFavorite,
} from '../../services/expert-route';
import { ensureLogin } from '../../utils/ensure-login';
import { buildExpertMetaText, HEART_ICONS } from '../../utils/expert-route-view';
import type {
  ExpertRouteAttractionItem,
  ExpertRouteDayVO,
  ExpertRouteDetail,
} from '../../types/expert-route';

/** 分天资源展示名的固定顺序与文案（批次 1 恒为 null，有值才渲染） */
const DAY_RESOURCE_LABELS: Array<{ key: keyof ExpertRouteDayVO; label: string }> = [
  { key: 'accommodationName', label: '住宿' },
  { key: 'breakfastName', label: '早餐' },
  { key: 'lunchName', label: '午餐' },
  { key: 'dinnerName', label: '晚餐' },
  { key: 'carNickname', label: '包车' },
  { key: 'photographyNickname', label: '跟拍' },
];

interface DayResourceView {
  label: string;
  value: string;
}

interface ExpertDayView {
  routeDayId: number;
  dayIndex: number;
  /** 「第 1 天」 */
  dayLabel: string;
  dayTheme: string;
  dayIntro: string;
  resources: DayResourceView[];
  /** attraction-card 的 item 视图模型；locked 态已在前端二次脱敏 */
  attractions: Record<string, any>[];
  attractionCount: number;
  /** 遮挡（盲盒）景点数，用于给用户一个预期 */
  lockedCount: number;
}

/** null / undefined / 纯空白 → 空串（WXML 侧一律靠 wx:if 判空串） */
function trimOrEmpty(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * locked 态契约禁发的敏感键（W2 表：服务端对这些字段一律不下发）。
 * 这里列出来做**前端第二道防线**：即使服务端某天误下发，也不进渲染视图、
 * 不进页面 data（B8 同类泄漏问题的前端侧兜底，安全红线）。
 */
const LOCKED_SENSITIVE_KEYS = [
  'attractionName',
  'attractionShortName',
  'attractionDescription',
  'attachments',
  'longitude',
  'latitude',
  'fuzzyLongitude',
  'fuzzyLatitude',
  'fuzzyRadius',
  'openTime',
  'bestViewingTime',
  'ticketPriceA',
  'ticketPriceC',
] as const;

/**
 * 把原始 detail 里 locked 景点的敏感字段剥掉后再存进 data。
 * wxml 只用 `detail` 做真值门（wx:elif），展示数据全部走 days 视图模型，
 * 所以这里脱敏不影响任何渲染；visible 项原样保留（后端下发全量字段含真实坐标）。
 */
function sanitizeDetailForView(detail: ExpertRouteDetail): ExpertRouteDetail {
  if (!detail.days || detail.days.length === 0) return detail;
  return {
    ...detail,
    days: detail.days.map((day) => ({
      ...day,
      attractions: (day.attractions || []).map((item) => {
        if (item.displayMode !== 'locked') return item;
        const copy: Record<string, any> = { ...item };
        LOCKED_SENSITIVE_KEYS.forEach((key) => delete copy[key]);
        return copy as ExpertRouteAttractionItem;
      }),
    })),
  };
}

/**
 * 把契约里的 AttractionItem 转成 attraction-card 的 item。
 *
 * ⚠️ **locked 态走白名单构造**（契约 W2 表 + 设计文档 §13.5 / :909）：
 *    只挑后端确定会下发的文字 hint，映射到 attraction-card 遮挡卡的既有槽位——
 *      stationLabel      → 卡片徽标「第N站」（服务端算好，前端不重算）
 *      attractionBlurb   → fuzzyDescription（一句话吊胃口）
 *      indoorOutdoor     → categoryHint（室内/室外）
 *      visitDuration     → durationHint（建议游玩时长）
 *      attractionNotes   → prepHint（出行准备提示）
 *      classicRating / leisureRating → 两个指数
 *      expertIntro       → 达人点评正文
 *    **不传任何坐标**：locked 态后端一个坐标都不下发（下发等于给爬虫近似位置库），
 *    所以这里既不渲染坐标、也不画模糊圈、更不写「坐标缺失」兜底文案。
 *    白名单构造还带来一层额外保险：即使服务端某天误下发 name/description/attachments，
 *    前端也不会把它们渲染出来——脱敏不依赖单一环节（B8 同类问题的前端侧防线）。
 */
function toAttractionCardItem(
  item: ExpertRouteAttractionItem,
): Record<string, any> {
  if (item.displayMode === 'locked') {
    // 所有 hint 都可能是 null（后端对没有该数据的景点就返回 null），逐个兜空串，
    // 组件侧每一行都有 wx:if，空串即整行不渲染。
    const indoorOutdoor = trimOrEmpty(item.indoorOutdoor);
    const notes = trimOrEmpty(item.attractionNotes);
    return {
      attractionId: item.attractionId,
      blindDisplayMode: 'locked',
      stationLabel: trimOrEmpty(item.stationLabel),
      fuzzyDescription: trimOrEmpty(item.attractionBlurb),
      // attraction-card 把 categoryHint / prepHint 拼成一行（' · ' 分隔），但它的分隔符
      // 表达式只看 prepHint：categoryHint 为空时会渲染出「 · xxx」。不改共享组件，
      // 在映射侧兜住——indoorOutdoor 缺失时把 attractionNotes 顶到第一个槽位。
      categoryHint: indoorOutdoor || notes,
      prepHint: indoorOutdoor ? notes : '',
      durationHint: trimOrEmpty(item.visitDuration),
      classicRating: trimOrEmpty(item.classicRating),
      leisureRating: trimOrEmpty(item.leisureRating),
      expertIntro: trimOrEmpty(item.expertIntro),
    };
  }

  return {
    attractionId: item.attractionId,
    blindDisplayMode: 'visible',
    stationLabel: item.stationLabel || '',
    attractionName: item.attractionName || '',
    attractionShortName: item.attractionShortName || '',
    attractionBlurb: item.attractionBlurb || '',
    attractionDescription: item.attractionDescription || '',
    classicRating: item.classicRating || '',
    leisureRating: item.leisureRating || '',
    visitDuration: item.visitDuration || '',
    openTime: item.openTime || '',
    ticketPriceA: item.ticketPriceA || '',
    ticketPriceC: item.ticketPriceC || '',
    indoorOutdoor: item.indoorOutdoor || '',
    attachments: item.attachments || [],
    longitude: item.longitude ?? null,
    latitude: item.latitude ?? null,
    /** 达人点评：attraction-card 在 readonly 下额外渲染这一行 */
    expertIntro: item.expertIntro || '',
  };
}

function toDayView(day: ExpertRouteDayVO): ExpertDayView {
  const attractions = (day.attractions || [])
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(toAttractionCardItem);

  const resources: DayResourceView[] = [];
  DAY_RESOURCE_LABELS.forEach(({ key, label }) => {
    const value = day[key];
    if (typeof value === 'string' && value.trim()) {
      resources.push({ label, value: value.trim() });
    }
  });

  return {
    routeDayId: day.routeDayId,
    dayIndex: day.dayIndex,
    dayLabel: `第 ${day.dayIndex} 天`,
    dayTheme: day.dayTheme || '',
    dayIntro: day.dayIntro || '',
    resources,
    attractions,
    attractionCount: attractions.length,
    lockedCount: attractions.filter((a) => a.blindDisplayMode === 'locked').length,
  };
}

Page({
  data: {
    routeId: 0,
    detail: null as ExpertRouteDetail | null,
    routeTitle: '',
    coverUrl: '',
    coverFallback: '',
    regionName: '',
    metaText: '',
    intro: '',
    introExpanded: false,
    authorNickname: '',
    authorAvatar: '',
    authorFallback: '',
    favorited: false,
    favoriteCount: 0,
    // 爱心图标：OSS 优先，binderror 回落包内本地文件（详见 utils/expert-route-view.ts）
    heartOutlineIcon: HEART_ICONS.ossOutline as string,
    heartFilledIcon: HEART_ICONS.ossFilled as string,
    /** 收藏请求在途标记，防止连点造成两次相反的乐观更新 */
    favoritePending: false,
    days: [] as ExpertDayView[],
    datePickerShow: false,
    /** 创建行程防连点锁（后端不做幂等，同一路线可以合法地建多条行程） */
    creating: false,
    loading: true,
    loadError: '',
    showAttractionIntro: false,
    attractionIntroData: null as Record<string, any> | null,
  },

  onLoad(query: any) {
    const routeId = Number(query?.routeId || 0);
    if (!routeId) {
      this.setData({ loading: false, loadError: '路线参数缺失' });
      return;
    }
    this.setData({ routeId });
    this.fetchDetail(routeId);
  },

  async fetchDetail(routeId: number) {
    this.setData({ loading: true, loadError: '' });
    try {
      const res = await getExpertRouteDetail(routeId);
      const detail = res?.data;
      if (!detail || !detail.routeId) {
        this.setData({ loading: false, loadError: '达人路线不存在或已下架' });
        return;
      }

      const title = detail.routeTitle || '未命名路线';
      const author = detail.authorNickname || '达人';
      const days = (detail.days || [])
        .slice()
        .sort((a, b) => (a.dayIndex || 0) - (b.dayIndex || 0))
        .map(toDayView);

      this.setData({
        // locked 项敏感字段落 data 前先剥掉（第二道防线，见 sanitizeDetailForView）
        detail: sanitizeDetailForView(detail),
        routeTitle: title,
        coverUrl: detail.coverUrl || '',
        coverFallback: title.charAt(0),
        // regionName 是服务端解析好的名称，前端不再拼编码（契约 B6）
        regionName: detail.regionName || '',
        metaText: buildExpertMetaText(detail.dayCount, detail.attractionCount),
        intro: detail.intro || '',
        introExpanded: false,
        authorNickname: author,
        authorAvatar: detail.authorAvatar || '',
        authorFallback: author.charAt(0),
        favorited: detail.favorited === true,
        favoriteCount: Number(detail.favoriteCount || 0),
        days,
        loading: false,
        loadError: '',
      });
    } catch (err: any) {
      // utils/request 已弹 toast；这里给页面级错误态而不是空白页
      console.error('加载达人路线详情失败:', err);
      this.setData({
        loading: false,
        loadError: err?.message || '加载失败，请稍后重试',
      });
    }
  },

  onRetry() {
    if (this.data.routeId) {
      this.fetchDetail(this.data.routeId);
    }
  },

  onHeartIconError() {
    if (this.data.heartOutlineIcon === HEART_ICONS.localOutline) return;
    this.setData({
      heartOutlineIcon: HEART_ICONS.localOutline,
      heartFilledIcon: HEART_ICONS.localFilled,
    });
  },

  onToggleIntro() {
    this.setData({ introExpanded: !this.data.introExpanded });
  },

  /**
   * 收藏 / 取消收藏：乐观更新 + 失败回滚。
   */
  async onFavoriteTap() {
    const routeId = this.data.routeId;
    if (!routeId || this.data.favoritePending) return;

    const loggedIn = await ensureLogin();
    if (!loggedIn) return;

    const prevFavorited = this.data.favorited;
    const prevCount = this.data.favoriteCount;
    const nextFavorited = !prevFavorited;
    this.setData({
      favoritePending: true,
      favorited: nextFavorited,
      favoriteCount: Math.max(0, prevCount + (nextFavorited ? 1 : -1)),
    });

    try {
      const res = await toggleExpertRouteFavorite(routeId, nextFavorited);
      const data = res?.data;
      if (data) {
        this.setData({
          favorited: data.favorited === true,
          favoriteCount: Number(data.favoriteCount || 0),
        });
      }
    } catch (err) {
      console.error('收藏操作失败，已回滚:', err);
      this.setData({ favorited: prevFavorited, favoriteCount: prevCount });
    } finally {
      this.setData({ favoritePending: false });
    }
  },

  /**
   * 景点详情抽屉：只有 visible 态可点开。
   * locked 态服务端没下发名称与介绍，点开只会得到一个空抽屉，等于给一个点了没内容的入口。
   */
  onAttractionDetail(e: any) {
    const data = e?.detail?.data;
    if (!data || data.blindDisplayMode === 'locked') return;
    this.setData({ showAttractionIntro: true, attractionIntroData: data });
  },

  onAttractionIntroClose() {
    this.setData({ showAttractionIntro: false, attractionIntroData: null });
  },

  async onCreateTap() {
    if (this.data.creating || !this.data.routeId) return;
    const loggedIn = await ensureLogin();
    if (!loggedIn) return;
    this.setData({ datePickerShow: true });
  },

  onDatePickerClose() {
    this.setData({ datePickerShow: false });
  },

  /** 日期**非必填**：picker 的「暂不选择日期」会回传空串，这里统一转 null */
  onDateConfirm(e: any) {
    const travelDate = e?.detail?.startDate || null;
    this.setData({ datePickerShow: false });
    this.doCreateItinerary(travelDate);
  },

  async doCreateItinerary(travelDate: string | null) {
    if (this.data.creating) return;
    this.setData({ creating: true });
    try {
      const res = await createItineraryFromExpertRoute(this.data.routeId, travelDate);
      const itineraryId = Number(res?.data?.itineraryId || 0);
      if (!itineraryId) {
        wx.showToast({ title: '创建失败，请稍后重试', icon: 'none' });
        return;
      }
      // redirect 而非 navigateTo：避免返回键回到详情页再点一次又建一条
      wx.redirectTo({ url: `/pages/itinerary-detail/index?id=${itineraryId}` });
    } catch (err) {
      // utils/request 已弹 toast，这里只收敛 creating 锁
      console.error('用达人路线创建行程失败:', err);
    } finally {
      this.setData({ creating: false });
    }
  },
});
