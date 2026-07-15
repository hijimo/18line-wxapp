import { getItineraryList, removeItinerary } from '../../services/itinerary';
import type { Itinerary } from '../../types/itinerary';

interface JourneyItem {
  id: number;
  title: string;
  image: string;
  status: string;
  statusType: string;
  phase: string;
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

// 按日期判断行程相位。ponytail: 暂不判断"已完成"，结束的行程归为 ended，仅在"全部"里出现
const PHASE_LABEL: Record<string, { label: string; type: string }> = {
  pending: { label: '待开始', type: 'draft' },
  active: { label: '进行中', type: 'confirmed' },
  ended: { label: '已结束', type: 'completed' },
};

const VALID_FILTERS = ['all', 'pending', 'active'];

function computePhase(startDate?: string, endDate?: string, days?: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseLocalDate(startDate);
  if (!start) return 'pending';
  if (start.getTime() > today.getTime()) return 'pending';
  const end = getEndDate(startDate, endDate, days);
  if (end && end.getTime() < today.getTime()) return 'ended';
  return 'active';
}

Page({
  data: {
    currentFilter: 'all',
    filters: [
      { id: 'all', label: '全部', active: true },
      { id: 'pending', label: '待开始', active: false },
      { id: 'active', label: '进行中', active: false },
    ],
    journeys: [] as JourneyItem[],
  },

  _allJourneys: [] as JourneyItem[],

  onLoad(options: any) {
    if (options?.filter) {
      this.setFilter(options.filter);
    }
    this.loadJourneys();
  },

  async loadJourneys() {
    try {
      const res = await getItineraryList();
      const list: Itinerary[] = res.data || [];
      this._allJourneys = list.map((item) => {
        const phase = computePhase(item.startDate, item.endDate, item.days);
        const phaseInfo = PHASE_LABEL[phase];
        return {
          id: item.itineraryId || 0,
          title: item.itineraryName || '未命名旅途',
          image: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/lingyin-temple.png',
          status: phaseInfo.label,
          statusType: phaseInfo.type,
          phase,
          date: formatJourneyDateRange(item.startDate, item.endDate, item.days),
          location: item.districtName || '',
          tags: item.createFromLabel ? [item.createFromLabel] : [],
          rating: '',
        };
      });
      this.applyFilter();
    } catch (err) {
      console.error('Failed to load journeys:', err);
    }
  },

  applyFilter() {
    const { currentFilter } = this.data;
    const journeys = currentFilter === 'all'
      ? this._allJourneys
      : this._allJourneys.filter((j) => j.phase === currentFilter);
    this.setData({ journeys });
  },

  setFilter(filterId: string) {
    const id = VALID_FILTERS.includes(filterId) ? filterId : 'all';
    const filters = this.data.filters.map((f) => ({
      ...f,
      active: f.id === id,
    }));
    this.setData({ currentFilter: id, filters });
  },

  onFilterTap(e: any) {
    const id = e.currentTarget.dataset.id;
    this.setFilter(id);
    this.applyFilter();
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
