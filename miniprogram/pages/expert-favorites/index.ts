import {
  getExpertRouteFavorites,
  toggleExpertRouteFavorite,
} from '../../services/expert-route';
import { ensureLogin } from '../../utils/ensure-login';
import { toExpertRouteCardView } from '../../utils/expert-route-view';
import type { ExpertRouteCardView } from '../../utils/expert-route-view';
import type { ExpertRouteListItem } from '../../types/expert-route';

const PAGE_SIZE = 10;

/**
 * 我喜欢的路线 —— 达人路线收藏列表（W4）。
 *
 * 与 pages/expert 共用 expert-route-card（layout="list"）与同一套视图模型，
 * 差别只在数据源与「取消收藏」的语义：收藏页取消成功后**把卡片移出列表**
 * （停留原地的空心甘心卡会误导用户以为还在收藏里），失败则回滚。
 */
Page({
  data: {
    records: [] as ExpertRouteCardView[],
    pageNum: 1,
    total: 0,
    /** 首屏/翻页请求中 */
    loading: false,
    /** 触底加载中（底部文案用） */
    loadingMore: false,
    /** 首次请求已结束（成功或失败），区分「加载中」与「真的没数据」 */
    loaded: false,
    /** 首屏失败 → 错误态 + 重试入口 */
    loadError: false,
    finished: false,
  },

  /** 收藏请求在途标记，防止连点造成两次相反的乐观更新（不进 data：从不渲染） */
  favPending: {} as Record<number, boolean>,

  onLoad() {
    this.fetchFavorites(true);
  },

  onPullDownRefresh() {
    this.fetchFavorites(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.loading || this.data.loadingMore || this.data.finished) return;
    this.fetchFavorites(false);
  },

  /**
   * @param reset true=回到第一页（onLoad / 下拉刷新 / 重试），false=追加下一页
   */
  async fetchFavorites(reset: boolean) {
    if (this.data.loading || this.data.loadingMore) return;

    // W4 需要 tourist 登录态：未登录先静默登录；失败进错误态（带重试入口），不白屏
    const loggedIn = await ensureLogin();
    if (!loggedIn) {
      this.setData({
        loading: false,
        loadingMore: false,
        loaded: true,
        loadError: reset ? true : this.data.loadError,
      });
      return;
    }

    const nextPage = reset ? 1 : this.data.pageNum + 1;
    if (reset) {
      this.setData({ loading: true, loadError: false });
    } else {
      this.setData({ loadingMore: true });
    }

    try {
      const res = await getExpertRouteFavorites({
        pageNum: nextPage,
        pageSize: PAGE_SIZE,
      });
      const rows: ExpertRouteListItem[] = (res as any)?.rows || [];
      const total = Number((res as any)?.total || 0);
      const views = rows.map(toExpertRouteCardView);
      const merged = reset ? views : this.data.records.concat(views);

      this.setData({
        records: merged,
        pageNum: nextPage,
        total,
        // 用 total 判定结束，不能只看「本页 0 条」：rows 为空也可能是接口异常
        finished: merged.length >= total || rows.length === 0,
        loading: false,
        loadingMore: false,
        loaded: true,
        loadError: false,
      });
    } catch (err) {
      // utils/request 已弹 toast，页面只负责给「重试」入口，不重复弹、不白屏
      console.error('加载我喜欢的路线失败:', err);
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
    this.fetchFavorites(true);
  },

  onCardTap(e: any) {
    const routeId = Number(e?.detail?.item?.routeId || 0);
    if (!routeId) return;
    wx.navigateTo({ url: `/pages/expert-detail/index?routeId=${routeId}` });
  },

  /**
   * 收藏 / 取消收藏：乐观更新 + 失败回滚；**取消成功后移出列表**。
   */
  async onFavoriteTap(e: any) {
    const routeId = Number(e?.detail?.item?.routeId || 0);
    if (!routeId || this.favPending[routeId]) return;

    const loggedIn = await ensureLogin();
    if (!loggedIn) return;

    const index = this.data.records.findIndex((it) => it.routeId === routeId);
    if (index < 0) return;
    const current = this.data.records[index];

    const nextFavorited = !current.favorited;
    const nextCount = Math.max(
      0,
      current.favoriteCount + (nextFavorited ? 1 : -1),
    );
    this.applyFavorite(index, nextFavorited, nextCount);
    this.favPending[routeId] = true;

    try {
      const res = await toggleExpertRouteFavorite(routeId, nextFavorited);
      const data = res?.data;
      if (data && data.favorited === false) {
        // 取消收藏成功：从收藏列表移除（W3 是物理删除，刷新后也不会再出现）
        this.removeRecord(routeId);
      } else if (data) {
        const nowIndex = this.data.records.findIndex(
          (it) => it.routeId === routeId,
        );
        if (nowIndex >= 0) {
          this.applyFavorite(
            nowIndex,
            data.favorited === true,
            Number(data.favoriteCount || 0),
          );
        }
      }
    } catch (err) {
      // utils/request 已弹 toast，这里只回滚视图，避免重复提示
      console.error('收藏操作失败，已回滚:', err);
      const nowIndex = this.data.records.findIndex(
        (it) => it.routeId === routeId,
      );
      if (nowIndex >= 0) {
        this.applyFavorite(nowIndex, current.favorited, current.favoriteCount);
      }
    } finally {
      delete this.favPending[routeId];
    }
  },

  /** 路径更新，只传两个字段，避免整表 setData */
  applyFavorite(index: number, favorited: boolean, favoriteCount: number) {
    const patch: Record<string, unknown> = {};
    patch[`records[${index}].favorited`] = favorited;
    patch[`records[${index}].favoriteCount`] = favoriteCount;
    this.setData(patch as any);
  },

  removeRecord(routeId: number) {
    const records = this.data.records.filter((it) => it.routeId !== routeId);
    this.setData({
      records,
      total: Math.max(0, this.data.total - 1),
      finished: records.length >= Math.max(0, this.data.total - 1),
    });
  },

  goExpertTab() {
    wx.switchTab({ url: '/pages/expert/index' });
  },
});
