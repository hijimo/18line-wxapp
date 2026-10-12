import {
  getExpertRouteList,
  toggleExpertRouteFavorite,
} from '../../services/expert-route';
import { ensureLogin } from '../../utils/ensure-login';
import { toExpertRouteCardView } from '../../utils/expert-route-view';
import type { ExpertRouteCardView } from '../../utils/expert-route-view';
import type { ExpertRouteListItem } from '../../types/expert-route';

const PAGE_SIZE = 10;

/** 封面固定高度（rpx），与 expert-route-card.scss 的 &__media 保持一致 */
const COVER_HEIGHT = 340;

interface ColumnPos {
  col: 'leftCol' | 'rightCol';
  pos: number;
}

/**
 * 估算卡片高度（rpx）用于分列。
 * 双列瀑布流**不用奇偶交替**：标题长短差异大时交替会出现明显空洞，
 * 一律放进「当前更短的那一列」（设计文档 §6.3）。
 */
function estimateHeight(view: ExpertRouteCardView): number {
  // 双列卡宽约 340rpx，28rpx 字号下每行约 11 个汉字，标题最多 2 行
  const titleLines = Math.min(2, Math.max(1, Math.ceil(view.routeTitle.length / 11)));
  let height = COVER_HEIGHT + 44 + titleLines * 40 + 52;
  if (view.regionName) height += 30;
  if (view.metaText) height += 30;
  return height;
}

Page({
  data: {
    leftCol: [] as ExpertRouteCardView[],
    rightCol: [] as ExpertRouteCardView[],
    pageNum: 1,
    total: 0,
    /** 首屏/翻页请求中 */
    loading: false,
    /** 触底加载中（底部文案用） */
    loadingMore: false,
    /** 首次请求已结束（成功或失败），用于区分「加载中」与「真的没数据」 */
    loaded: false,
    /** 首屏失败 → 错误态 + 重试入口 */
    loadError: false,
    finished: false,
  },

  // ---- 以下都是**实例字段**，不进 data：leftH/rightH 从不渲染，放 data 里等于白传一次桥 ----
  /** 扁平数据源，收藏乐观更新与回滚都从这里读原值 */
  items: [] as ExpertRouteCardView[],
  /** routeId → 所在列与列内下标，用于 setData 路径更新 */
  posOf: {} as Record<number, ColumnPos>,
  leftH: 0,
  rightH: 0,
  /** 收藏请求在途标记，防止连点造成两次相反的乐观更新 */
  favPending: {} as Record<number, boolean>,

  onLoad() {
    this.fetchRoutes(true);
  },

  onPullDownRefresh() {
    this.fetchRoutes(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.loading || this.data.loadingMore || this.data.finished) return;
    this.fetchRoutes(false);
  },

  /**
   * @param reset true=回到第一页（onLoad / 下拉刷新 / 重试），false=追加下一页
   */
  async fetchRoutes(reset: boolean) {
    if (this.data.loading || this.data.loadingMore) return;

    const nextPage = reset ? 1 : this.data.pageNum + 1;
    if (reset) {
      this.setData({ loading: true, loadError: false });
    } else {
      this.setData({ loadingMore: true });
    }

    try {
      const res = await getExpertRouteList({
        pageNum: nextPage,
        pageSize: PAGE_SIZE,
      });
      const rows: ExpertRouteListItem[] = (res as any)?.rows || [];
      const total = Number((res as any)?.total || 0);
      const views = rows.map(toExpertRouteCardView);

      if (reset) {
        this.resetColumns(views);
      } else {
        this.appendColumns(views);
      }

      const count = reset ? views.length : this.items.length;
      this.setData({
        pageNum: nextPage,
        total,
        // 用 total 判定结束，不能只看「本页 0 条」：rows 为空也可能是接口异常
        finished: count >= total || rows.length === 0,
        loading: false,
        loadingMore: false,
        loaded: true,
        loadError: false,
      });
    } catch (err) {
      // utils/request 已弹 toast，页面只负责给「重试」入口，不重复弹、不白屏
      console.error('加载达人路线列表失败:', err);
      this.setData({
        loading: false,
        loadingMore: false,
        loaded: true,
        // 已有数据时翻页失败不打断浏览，只在首屏失败时切错误态
        loadError: reset ? true : this.data.loadError,
      });
    }
  },

  onRetry() {
    this.fetchRoutes(true);
  },

  /** 首屏：整体重排两列（一次 setData 传完整数组，此时数据量只有 10 条） */
  resetColumns(views: ExpertRouteCardView[]) {
    const leftCol: ExpertRouteCardView[] = [];
    const rightCol: ExpertRouteCardView[] = [];
    const posOf: Record<number, ColumnPos> = {};

    this.leftH = 0;
    this.rightH = 0;

    views.forEach((view) => {
      const height = estimateHeight(view);
      if (this.leftH <= this.rightH) {
        posOf[view.routeId] = { col: 'leftCol', pos: leftCol.length };
        leftCol.push(view);
        this.leftH += height;
      } else {
        posOf[view.routeId] = { col: 'rightCol', pos: rightCol.length };
        rightCol.push(view);
        this.rightH += height;
      }
    });

    this.items = views.slice();
    this.posOf = posOf;
    this.setData({ leftCol, rightCol });
  },

  /**
   * 追加下一页：**必须用 setData 路径更新**（`leftCol[12] = xxx`）。
   * 翻到第 5 页时数组有 50 项，全量 setData 会把 50 个对象序列化过桥，低端安卓掉帧明显。
   */
  appendColumns(views: ExpertRouteCardView[]) {
    const patch: Record<string, unknown> = {};

    views.forEach((view) => {
      const height = estimateHeight(view);
      const toLeft = this.leftH <= this.rightH;
      const col: 'leftCol' | 'rightCol' = toLeft ? 'leftCol' : 'rightCol';
      const pos = toLeft ? this.data.leftCol.length : this.data.rightCol.length;

      patch[`${col}[${pos}]`] = view;
      this.posOf[view.routeId] = { col, pos };
      this.items.push(view);
      if (toLeft) {
        this.leftH += height;
      } else {
        this.rightH += height;
      }
    });

    if (Object.keys(patch).length > 0) {
      this.setData(patch as any);
    }
  },

  onCardTap(e: any) {
    const routeId = Number(e?.detail?.item?.routeId || 0);
    if (!routeId) return;
    wx.navigateTo({ url: `/pages/expert-detail/index?routeId=${routeId}` });
  },

  /**
   * 收藏 / 取消收藏：乐观更新 + 失败回滚。
   *
   * 取消收藏不做二次确认（可逆操作、误触成本低，弹窗反而烦人）。
   */
  async onFavoriteTap(e: any) {
    const routeId = Number(e?.detail?.item?.routeId || 0);
    if (!routeId) return;
    if (this.favPending[routeId]) return;

    // 收藏接口需要 tourist 登录态；列表/详情是匿名的，不能依赖 request 层的 401 兜底
    const loggedIn = await ensureLogin();
    if (!loggedIn) return;

    const pos = this.posOf[routeId];
    const current = this.items.find((it) => it.routeId === routeId);
    if (!pos || !current) return;

    const nextFavorited = !current.favorited;
    const nextCount = Math.max(
      0,
      current.favoriteCount + (nextFavorited ? 1 : -1),
    );
    this.applyFavorite(routeId, nextFavorited, nextCount);
    this.favPending[routeId] = true;

    try {
      const res = await toggleExpertRouteFavorite(routeId, nextFavorited);
      const data = res?.data;
      // 以服务端返回值为准（幂等接口，重复收藏/取消都返回真实计数）
      if (data) {
        this.applyFavorite(
          routeId,
          data.favorited === true,
          Number(data.favoriteCount || 0),
        );
      }
    } catch (err) {
      // utils/request 已弹 toast，这里只回滚视图，避免重复提示
      console.error('收藏操作失败，已回滚:', err);
      this.applyFavorite(routeId, current.favorited, current.favoriteCount);
    } finally {
      delete this.favPending[routeId];
    }
  },

  /** 同步实例数据源与视图（路径更新，只传两个字段） */
  applyFavorite(routeId: number, favorited: boolean, favoriteCount: number) {
    const pos = this.posOf[routeId];
    const current = this.items.find((it) => it.routeId === routeId);
    if (current) {
      current.favorited = favorited;
      current.favoriteCount = favoriteCount;
    }
    if (!pos) return;
    const patch: Record<string, unknown> = {};
    patch[`${pos.col}[${pos.pos}].favorited`] = favorited;
    patch[`${pos.col}[${pos.pos}].favoriteCount`] = favoriteCount;
    this.setData(patch as any);
  },
});
