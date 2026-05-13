import { getItineraryList } from '../../services/itinerary';
import type { Itinerary } from '../../types/itinerary';

interface JourneyItem {
  id: number;
  title: string;
  image: string;
  status: string;
  statusType: string;
  date: string;
  location: string;
  tags: string[];
  rating: string;
}

const STATUS_MAP: Record<string, { label: string; type: string }> = {
  '0': { label: '草稿', type: 'draft' },
  '1': { label: '已确认', type: 'confirmed' },
  '2': { label: '已完成', type: 'completed' },
  '3': { label: '已取消', type: 'cancelled' },
};

const FILTER_STATUS_MAP: Record<string, string> = {
  active: '1',
  pending: '0',
  completed: '2',
};

Page({
  data: {
    currentFilter: 'all',
    filters: [
      { id: 'all', label: '全部', active: true },
      { id: 'pending', label: '待开始', active: false },
      { id: 'active', label: '进行中', active: false },
      { id: 'completed', label: '已完成', active: false },
    ],
    journeys: [] as JourneyItem[],
  },

  onLoad(options: any) {
    if (options?.filter) {
      this.setFilter(options.filter);
    }
    this.loadJourneys();
  },

  async loadJourneys() {
    try {
      const { currentFilter } = this.data;
      const params = currentFilter !== 'all'
        ? { status: FILTER_STATUS_MAP[currentFilter] }
        : undefined;
      const res = await getItineraryList(params);
      const list: Itinerary[] = res.data || [];
      const journeys: JourneyItem[] = list.map((item) => {
        const statusInfo = STATUS_MAP[item.status || '0'] || STATUS_MAP['0'];
        return {
          id: item.itineraryId || 0,
          title: item.itineraryName || '未命名旅途',
          image: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/lingyin-temple.png',
          status: statusInfo.label,
          statusType: statusInfo.type,
          date: item.startDate || '',
          location: `${item.city || ''}${item.district || ''}`,
          tags: item.createFromLabel ? [item.createFromLabel] : [],
          rating: '',
        };
      });

      this.setData({ journeys });
    } catch (err) {
      console.error('Failed to load journeys:', err);
    }
  },

  setFilter(filterId: string) {
    const filters = this.data.filters.map((f) => ({
      ...f,
      active: f.id === filterId,
    }));
    this.setData({ currentFilter: filterId, filters });
  },

  onFilterTap(e: any) {
    const id = e.currentTarget.dataset.id;
    this.setFilter(id);
    this.loadJourneys();
  },

  onJourneyTap(e: any) {
    const id = e.currentTarget.dataset.id;
    console.log('Journey tap:', id);
    wx.showToast({ title: '行程详情开发中', icon: 'none' });
  },
});
