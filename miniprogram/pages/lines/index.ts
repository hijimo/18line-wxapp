import { getLineList } from '../../services/line';
import type { TravelLineVO, LineListParams } from '../../types/line';

const PAGE_SIZE = 10;

interface LineCard {
  lineId: number;
  lineName: string;
  /** 已去重拼接的地区文案，如「浙江省 · 杭州市 · 西湖区」 */
  regionText: string;
  coverImage: string;
  /** 无封面时用线路名首字做占位，避免灰块 */
  coverFallback: string;
  merchantName: string;
  authorName: string;
  remark: string;
  /** '1' 表示可打赏，卡片上给一个轻量标识 */
  rewardEnabled: boolean;
}

/** 拼接地区并去掉重复层级（后端可能只填到市，或省市值相同） */
function buildRegionText(line: TravelLineVO): string {
  const parts = [line.province, line.city, line.district]
    .map((v) => (v || '').trim())
    .filter((v) => v.length > 0);
  const unique: string[] = [];
  parts.forEach((p) => {
    if (unique.indexOf(p) < 0) unique.push(p);
  });
  return unique.join(' · ');
}

function toCard(line: TravelLineVO): LineCard {
  const name = line.lineName || '未命名线路';
  return {
    lineId: line.lineId,
    lineName: name,
    regionText: buildRegionText(line),
    coverImage: line.coverImage || '',
    coverFallback: name.charAt(0),
    merchantName: line.merchantName || '',
    authorName: line.authorName || '线路作者',
    remark: line.remark || '',
    rewardEnabled: line.rewardEnabled === '1',
  };
}

Page({
  data: {
    keyword: '',
    lines: [] as LineCard[],
    pageNum: 1,
    total: 0,
    loading: false,
    /** 已加载完全部数据，用于停止触底请求 */
    finished: false,
    /** 首次加载完成标记，区分「加载中」与「真的没有数据」 */
    loaded: false,
  },

  onLoad() {
    this.fetchLines(true);
  },

  onPullDownRefresh() {
    this.fetchLines(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.loading || this.data.finished) return;
    this.fetchLines(false);
  },

  onKeywordInput(e: any) {
    this.setData({ keyword: e?.detail?.value ?? '' });
  },

  onSearch() {
    this.fetchLines(true);
  },

  onClearKeyword() {
    this.setData({ keyword: '' });
    this.fetchLines(true);
  },

  /**
   * @param reset true 表示回到第一页（搜索/下拉刷新），false 表示追加下一页
   */
  async fetchLines(reset: boolean) {
    if (this.data.loading) return;

    const nextPage = reset ? 1 : this.data.pageNum + 1;
    this.setData({ loading: true });

    try {
      const keyword = this.data.keyword.trim();
      const params: LineListParams = { pageNum: nextPage, pageSize: PAGE_SIZE };
      // 空关键词不能写成 keyword: keyword || undefined —— wx.request 会把 undefined
      // 拼成字面量 "undefined"，后端按 line_name like '%undefined%' 查询，列表恒为空
      if (keyword) params.keyword = keyword;
      const res = await getLineList(params);
      const rows: TravelLineVO[] = (res as any)?.rows || [];
      const total = Number((res as any)?.total || 0);
      const cards = rows.map(toCard);
      const merged = reset ? cards : this.data.lines.concat(cards);

      this.setData({
        lines: merged,
        pageNum: nextPage,
        total,
        // 拿到的累计条数达到 total，或本页返回空，即视为加载完
        finished: merged.length >= total || rows.length === 0,
        loading: false,
        loaded: true,
      });
    } catch (err) {
      // utils/request 已弹 toast，这里只收敛 loading，避免页面卡在骨架态
      console.error('加载线路列表失败:', err);
      this.setData({ loading: false, loaded: true });
    }
  },

  onLineTap(e: any) {
    const id = e?.currentTarget?.dataset?.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/line-detail/index?lineId=${id}` });
  },
});
