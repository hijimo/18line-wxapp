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
  '0': { label: '规划中', type: 'planning' },
  '1': { label: '进行中', type: 'active' },
  '2': { label: '待开始', type: 'pending' },
  '3': { label: '已完成', type: 'completed' },
  '4': { label: '已取消', type: 'cancelled' },
};

Page({
  data: {
    currentFilter: 'active',
    filters: [
      { id: 'active', label: '进行中', active: true },
      { id: 'pending', label: '待开始', active: false },
      { id: 'completed', label: '已完成', active: false },
    ],
    journeys: [] as JourneyItem[],
    allJourneys: [] as JourneyItem[],
  },

  onLoad(options: any) {
    if (options?.filter) {
      const filterMap: Record<string, string> = {
        pending: 'pending',
        cancelled: 'completed',
        completed: 'completed',
      };
      const filterId = filterMap[options.filter] || 'active';
      this.setFilter(filterId);
    }

    this.loadJourneys();
  },

  async loadJourneys() {
    try {
      const res = await getItineraryList();
      const list: Itinerary[] = res.data || [];
      const allJourneys: JourneyItem[] = list.map((item) => {
        const statusInfo = STATUS_MAP[item.status || '0'] || STATUS_MAP['0'];
        return {
          id: item.itineraryId || 0,
          title: item.itineraryName || '未命名旅途',
          image: '/assets/images/lingyin-temple.png',
          status: statusInfo.label,
          statusType: statusInfo.type,
          date: item.startDate || '',
          location: `${item.city || ''}${item.district || ''}`,
          tags: item.createFromLabel ? [item.createFromLabel] : [],
          rating: '',
        };
      });

      this.setData({ allJourneys });
      this.applyFilter();
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

  applyFilter() {
    const { allJourneys, currentFilter } = this.data;
    const filtered = allJourneys.filter((j) => j.statusType === currentFilter);
    this.setData({ journeys: filtered.length > 0 ? filtered : allJourneys });
  },

  onFilterTap(e: any) {
    const id = e.currentTarget.dataset.id;
    this.setFilter(id);
    this.applyFilter();
  },

  onJourneyTap(e: any) {
    const id = e.currentTarget.dataset.id;
    console.log('Journey tap:', id);
    wx.showToast({ title: '行程详情开发中', icon: 'none' });
  },
});
