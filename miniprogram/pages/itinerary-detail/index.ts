import { getItinerary } from '../../services/itinerary';
import type { Itinerary, TravelItineraryDay } from '../../types/itinerary';

Page({
  data: {
    itineraryId: 0,
    itinerary: null as Itinerary | null,
    currentDay: 1,
    currentDayData: null as TravelItineraryDay | null,
    loading: true,
    showAddDrawer: false,
    showIntroDrawer: '' as 'attraction' | 'hotel' | 'dining' | 'car' | 'photography' | '',
    introData: null as any,
    addDayNumber: 1,
  },

  onLoad(options: Record<string, string | undefined>) {
    const rawId = options.id;

    if (!rawId || isNaN(Number(rawId)) || Number(rawId) <= 0) {
      wx.showToast({ title: '行程不存在', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    const itineraryId = Number(rawId);
    this.setData({ itineraryId });
    this.loadItinerary();
  },

  async loadItinerary() {
    const { itineraryId, currentDay } = this.data;
    this.setData({ loading: true });

    try {
      const res = await getItinerary(itineraryId);
      const itinerary = res.data;

      if (!itinerary) {
        wx.showToast({ title: '行程数据为空', icon: 'none' });
        return;
      }

      const daysList = itinerary.daysList || [];
      const currentDayData = daysList.find((d) => d.dayNumber === currentDay) || daysList[0] || null;

      this.setData({
        itinerary,
        currentDayData,
        currentDay: currentDayData?.dayNumber || 1,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to load itinerary:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onDayTap(e: any) {
    const dayNumber = e.currentTarget.dataset.day;
    const { itinerary } = this.data;
    const daysList = itinerary?.daysList || [];
    const currentDayData = daysList.find((d) => d.dayNumber === dayNumber) || null;

    this.setData({ currentDay: dayNumber, currentDayData });
  },

  onAddSpot() {
    const { currentDay, showIntroDrawer } = this.data;
    if (showIntroDrawer) return; // 抽屉互斥
    this.setData({ showAddDrawer: true, addDayNumber: currentDay });
  },

  onCardDetail(e: any) {
    const { type, data } = e.detail;
    const { showAddDrawer } = this.data;
    if (showAddDrawer) return; // 抽屉互斥
    this.setData({ showIntroDrawer: type, introData: data });
  },

  onScheduleRefresh() {
    this.setData({ showAddDrawer: false });
    this.loadItinerary();
  },

  onDrawerClose() {
    this.setData({ showAddDrawer: false });
  },

  onIntroClose() {
    this.setData({ showIntroDrawer: '', introData: null });
  },

  onShareAppMessage() {
    const { itinerary, itineraryId } = this.data;
    return {
      title: itinerary?.itineraryName || '我的旅行行程',
      path: `/pages/itinerary-detail/index?id=${itineraryId}`,
    };
  },
});
