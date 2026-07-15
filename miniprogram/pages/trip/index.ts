import { getItineraryList } from '../../services/itinerary';
import type { Itinerary } from '../../types/itinerary';

interface TripItem {
  id: number;
  title: string;
  description: string;
  date: string;
  days: number;
  distance: string;
  image: string;
  days_detail: { day: number; status: string }[];
  phase: string;
  statusLabel: string;
  statusClass: string;
}

// 与 journeys 页保持一致：按日期判断待开始/进行中
const PHASE_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: '待开始', cls: 'pending' },
  active: { label: '进行中', cls: 'active' },
  ended: { label: '已结束', cls: 'completed' },
};

function computePhase(startDate?: string, endDate?: string, days?: number) {
  const matched = (startDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return 'pending';
  const start = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start.getTime() > today.getTime()) return 'pending';
  const endMatched = (endDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  const end = endMatched
    ? new Date(Number(endMatched[1]), Number(endMatched[2]) - 1, Number(endMatched[3]))
    : days && days > 0
      ? new Date(start.getTime() + (days - 1) * 86400000)
      : null;
  if (end && end.getTime() < today.getTime()) return 'ended';
  return 'active';
}

Page({
  data: {
    currentTab: 'all',
    trips: [] as TripItem[],
    allTrips: [] as TripItem[],
  },

  onLoad() {
    this.loadTrips();
  },

  onShow() {
    this.loadTrips();
  },

  async loadTrips() {
    try {
      const res = await getItineraryList();
      const list: Itinerary[] = res.data || [];
      const allTrips = list.map((item) => {
        const phase = computePhase(item.startDate, item.endDate, item.days);
        const phaseInfo = PHASE_LABEL[phase];
        return {
          id: item.itineraryId || 0,
          title: item.itineraryName || '未命名旅途',
          description: `${item.city || ''}${item.district || ''}`,
          date: item.startDate || '',
          days: item.days || 0,
          distance: '',
          image: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/lingyin-temple.png',
          days_detail: (item.daysList || []).map((_, i) => ({
            day: i + 1,
            status: 'upcoming',
          })),
          phase,
          statusLabel: phaseInfo.label,
          statusClass: phaseInfo.cls,
        };
      });

      this.setData({ allTrips });
      this.applyFilter();
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  },

  applyFilter() {
    const { allTrips, currentTab } = this.data;
    const trips = currentTab === 'all'
      ? allTrips
      : allTrips.filter((t) => t.phase === currentTab);
    this.setData({ trips });
  },

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.applyFilter();
  },

  onTripTap(e: any) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/itinerary-detail/index?id=${id}` });
  },
});
