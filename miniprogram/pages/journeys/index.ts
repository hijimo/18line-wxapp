import { getItineraryList, removeItinerary } from '../../services/itinerary';
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

function parseLocalDate(value?: string) {
  if (!value) return null;

  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return null;

  return new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3]),
  );
}

function formatMonthDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}.${day}`;
}

function getEndDate(startDate?: string, endDate?: string, days?: number) {
  const end = parseLocalDate(endDate);
  if (end) return end;

  const start = parseLocalDate(startDate);
  if (!start || !days || days <= 0) return null;

  const calculatedEnd = new Date(start.getTime());
  calculatedEnd.setDate(start.getDate() + days - 1);
  return calculatedEnd;
}

function formatJourneyDateRange(startDate?: string, endDate?: string, days?: number) {
  const start = parseLocalDate(startDate);
  const end = getEndDate(startDate, endDate, days);
  if (!start || !end) return '规划中';

  return `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
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
          date: formatJourneyDateRange(item.startDate, item.endDate, item.days),
          location: item.districtName || '',
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
    if (!id) return;
    wx.navigateTo({ url: `/pages/itinerary-detail/index?id=${id}` });
  },

  onDeleteTap(e: any) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个行程吗？',
      confirmColor: '#e53e3e',
      success: (res) => {
        if (res.confirm) {
          this.deleteJourney(id);
        }
      },
    });
  },

  async deleteJourney(id: number) {
    try {
      await removeItinerary({ itineraryId: id });
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadJourneys();
    } catch (err) {
      console.error('Failed to delete journey:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },
});
