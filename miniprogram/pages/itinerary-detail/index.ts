import {
  getItinerary,
  getItineraryList,
  autoGenerateItinerary,
} from '../../services/itinerary';
import { getTemplateDetail } from '../../services/template';
import { getLocalSpecialtyList } from '../../services/local-specialty';
import type { Itinerary, TravelItineraryDay } from '../../types/itinerary';
import type { TravelLocalSpecialtyDish } from '../../types/local-specialty';

Page({
  data: {
    itineraryId: 0,
    templateId: 0,
    isTemplate: false,
    itinerary: null as Itinerary | null,
    currentDay: 1,
    currentDayData: null as TravelItineraryDay | null,
    loading: true,
    showAddDrawer: false,
    showIntroDrawer: '' as
      | 'attraction'
      | 'hotel'
      | 'dining'
      | 'car'
      | 'photography'
      | '',
    introData: null as any,
    addDayNumber: 1,
    localSpecialtyList: [] as TravelLocalSpecialtyDish[],
  },

  onLoad(options: Record<string, string | undefined>) {
    const rawId = options.id;
    const rawTemplateId = options.templateId;

    if (
      rawTemplateId &&
      !isNaN(Number(rawTemplateId)) &&
      Number(rawTemplateId) > 0
    ) {
      this.setData({ templateId: Number(rawTemplateId), isTemplate: true });
      this.loadTemplateDetail();
      return;
    }

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

  async loadTemplateDetail() {
    const { templateId, currentDay } = this.data;
    this.setData({ loading: true });

    try {
      const res = await getTemplateDetail(templateId);
      const template = res.data;

      if (!template) {
        wx.showToast({ title: '模板数据为空', icon: 'none' });
        this.setData({ loading: false });
        return;
      }

      const daysList: TravelItineraryDay[] = (template.days || []).map(
        (d: any) => ({
          itineraryDayId: d.templateDayId,
          dayNumber: d.dayNumber,
          dayTheme: d.dayTheme,
          attractionList: d.attractionList || d.attractions || [],
          breakfast: d.breakfast || null,
          lunch: d.lunch || null,
          dinner: d.dinner || null,
          accommodation: d.accommodation || null,
          photography: d.photography || null,
          car: d.car || null,
        }),
      );

      const itinerary: Itinerary = {
        itineraryId: 0,
        templateId,
        itineraryName: template.templateName,
        province: template.province,
        city: template.city,
        cityName: template.cityName,
        district: template.district,
        districtName: template.districtName,
        days: template.baseDays || daysList.length,
        status: '0',
        daysList,
      };

      const currentDayData =
        daysList.find((d) => d.dayNumber === currentDay) || daysList[0] || null;

      this.setData({
        itinerary,
        currentDayData,
        currentDay: currentDayData?.dayNumber || 1,
        loading: false,
      });

      this.loadLocalSpecialty(
        template.province,
        template.city,
        template.district,
      );
    } catch (err) {
      console.error('Failed to load template:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onAddToMyTrip() {
    const { templateId } = this.data;

    try {
      const res = await getItineraryList();
      const existing = (res.data || []).find(
        (item) => item.templateId === templateId,
      );

      if (existing) {
        wx.showModal({
          title: '提示',
          content: '该模板已存在于您的行程中，是否再次创建？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.createFromTemplate();
            }
          },
        });
      } else {
        this.createFromTemplate();
      }
    } catch (err) {
      this.createFromTemplate();
    }
  },

  async createFromTemplate() {
    const { templateId, itinerary } = this.data;
    wx.showLoading({ title: '创建中...' });

    try {
      const res = await autoGenerateItinerary({
        templateId,
        province: itinerary?.province,
        city: itinerary?.city,
        district: itinerary?.district,
        days: itinerary?.days,
      });
      wx.hideLoading();
      const newItinerary = res.data;
      if (newItinerary?.itineraryId) {
        wx.redirectTo({
          url: `/pages/itinerary-detail/index?id=${newItinerary.itineraryId}`,
        });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
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
      const currentDayData =
        daysList.find((d) => d.dayNumber === currentDay) || daysList[0] || null;

      this.setData({
        itinerary,
        currentDayData,
        currentDay: currentDayData?.dayNumber || 1,
        loading: false,
      });

      this.loadLocalSpecialty(
        itinerary.province,
        itinerary.city,
        itinerary.district,
      );
    } catch (err) {
      console.error('Failed to load itinerary:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async loadLocalSpecialty(
    province?: string,
    city?: string,
    district?: string,
  ) {
    if (!province && !city) return;
    try {
      const res = await getLocalSpecialtyList({ province, city, district });
      this.setData({ localSpecialtyList: res.data || [] });
    } catch (err) {
      console.error('Failed to load local specialty:', err);
    }
  },

  onDayTap(e: any) {
    const dayNumber = e.currentTarget.dataset.day;
    const { itinerary } = this.data;
    const daysList = itinerary?.daysList || [];
    const currentDayData =
      daysList.find((d) => d.dayNumber === dayNumber) || null;

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
