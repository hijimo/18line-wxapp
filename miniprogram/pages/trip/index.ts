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
}

const STATUS_MAP: Record<string, string> = {
  '0': 'planning',
  '1': 'upcoming',
  '2': 'pending',
  '3': 'completed',
  '4': 'cancelled',
};

Page({
  data: {
    currentTab: 'upcoming',
    upcomingTrips: [] as TripItem[],
    pendingTrips: [] as TripItem[],
    completedTrips: [] as TripItem[],
    allTrips: [] as (TripItem & { statusType: string })[],
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
        const statusType = STATUS_MAP[item.status || '0'] || 'planning';
        return {
          id: item.itineraryId || 0,
          title: item.itineraryName || '未命名旅途',
          description: `${item.city || ''}${item.district || ''}`,
          date: item.startDate || '',
          days: item.days || 0,
          distance: '',
          image: '/assets/images/lingyin-temple.png',
          days_detail: (item.daysList || []).map((d, i) => ({
            day: i + 1,
            status: 'upcoming',
          })),
          statusType,
        };
      });

      this.setData({ allTrips });
      this.applyFilter();
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  },

  applyFilter() {
    const { allTrips } = this.data;
    this.setData({
      upcomingTrips: allTrips.filter((t) => t.statusType === 'upcoming' || t.statusType === 'planning'),
      pendingTrips: allTrips.filter((t) => t.statusType === 'pending'),
      completedTrips: allTrips.filter((t) => t.statusType === 'completed'),
    });
  },

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  onTripTap(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '行程详情开发中', icon: 'none' });
    console.log('Trip tap:', id);
  },
});
