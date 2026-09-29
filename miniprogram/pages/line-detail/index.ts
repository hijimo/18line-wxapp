import { getLineDetail } from '../../services/line';
import { checkVirtualPaymentCapability } from '../../utils/virtual-payment';
import type { LineAttraction, TravelLineVO } from '../../types/line';

interface AttractionView extends LineAttraction {
  /** 展示序号，两位数补零，符合「Field Guide」的编号感 */
  indexText: string;
  ratingText: string;
}

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

Page({
  data: {
    lineId: 0,
    line: null as TravelLineVO | null,
    regionText: '',
    coverFallback: '',
    attractions: [] as AttractionView[],
    loading: true,
    loadError: '',
    /**
     * 是否展示打赏入口。
     * 两个条件同时满足才为 true：线路 rewardEnabled='1' **且** 当前设备支持虚拟支付。
     * 任一不满足都**完全隐藏**入口，不做置灰处理——置灰会让用户误以为功能故障。
     */
    showRewardEntry: false,
    rewardPanelVisible: false,
    authorName: '线路作者',
    lineName: '',
  },

  onLoad(query: any) {
    const lineId = Number(query?.lineId || 0);
    if (!lineId) {
      this.setData({ loading: false, loadError: '线路参数缺失' });
      return;
    }
    this.setData({ lineId });
    this.fetchDetail(lineId);
  },

  async fetchDetail(lineId: number) {
    this.setData({ loading: true, loadError: '' });
    try {
      const res = await getLineDetail(lineId);
      const line = res?.data;
      if (!line || !line.lineId) {
        this.setData({ loading: false, loadError: '线路不存在或已下架' });
        return;
      }

      const rawAttractions = line.attractions || [];
      const attractions: AttractionView[] = rawAttractions.map((item, idx) => ({
        ...item,
        indexText: String(idx + 1).padStart(2, '0'),
        ratingText: item.classicRating ? `${item.classicRating} ★` : '',
      }));

      // 设备能力只与运行环境有关，与线路无关，进页面时判一次即可
      const capability = checkVirtualPaymentCapability();
      const rewardEnabled = line.rewardEnabled === '1';
      const name = line.lineName || '未命名线路';

      this.setData({
        line,
        regionText: buildRegionText(line),
        coverFallback: name.charAt(0),
        attractions,
        authorName: line.authorName || '线路作者',
        lineName: name,
        showRewardEntry: rewardEnabled && capability.supported,
        loading: false,
      });
    } catch (err: any) {
      // utils/request 已弹 toast；这里给出页面级错误态而不是空白页
      console.error('加载线路详情失败:', err);
      this.setData({ loading: false, loadError: err?.message || '加载失败，请稍后重试' });
    }
  },

  onRetry() {
    if (this.data.lineId) {
      this.fetchDetail(this.data.lineId);
    }
  },

  onOpenReward() {
    if (!this.data.lineId) return;
    this.setData({ rewardPanelVisible: true });
  },

  onCloseReward() {
    this.setData({ rewardPanelVisible: false });
  },

  onRewardSuccess() {
    // 打赏成功不需要刷新线路数据（线路内容与打赏无关），
    // 结果提示由 reward-panel 内部完成，这里只关闭面板。
    this.setData({ rewardPanelVisible: false });
  },

  onViewMyRewards() {
    wx.navigateTo({
      url: `/pages/reward-records/index?lineId=${this.data.lineId}`,
    });
  },
});
