import { getDictByType } from '../../services/dict';
import { autoGenerateItinerary, addItinerary } from '../../services/itinerary';
import type { DictData } from '../../types/dict';

const AI_PROGRESS_TEXTS = [
  '正在分析目的地特色...',
  '正在规划最佳路线...',
  '正在匹配优质资源...',
  '正在生成专属行程...',
];

Page({
  data: {
    provinceCode: '',
    cityCode: '',
    districtCode: '',
    provinceName: '',
    cityName: '',
    districtName: '',
    regionValue: [] as string[],
    startDate: '',
    endDate: '',
    startDateDisplay: '',
    endDateDisplay: '',
    preferences: [] as string[],
    preferenceOptions: [] as DictData[],
    blindMode: true,
    loading: false,
    progressText: '',
    showDatePicker: false,
  },

  _progressTimer: null as any,

  onLoad() {
    this.loadPreferenceOptions();
  },

  onUnload() {
    this.clearProgressTimer();
  },

  async loadPreferenceOptions() {
    try {
      const res = await getDictByType('travel_tourist_like');
      this.setData({ preferenceOptions: res.data || [] });
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  },

  onRegionChange(e: any) {
    const { value, code } = e.detail;
    this.setData({
      regionValue: value,
      provinceName: value[0] || '',
      cityName: value[1] || '',
      districtName: value[2] || '',
      provinceCode: code[0] || '',
      cityCode: code[1] || '',
      districtCode: code[2] || '',
    });
  },

  onDateTap() {
    this.setData({ showDatePicker: true });
  },

  onCloseDatePicker() {
    this.setData({ showDatePicker: false });
  },

  onConfirmDate() {
    this.setData({ showDatePicker: false });
  },

  formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parseInt(parts[1])}.${parseInt(parts[2])}`;
  },

  onStartDateChange(e: any) {
    const startDate = e.detail.value;
    this.setData({
      startDate,
      startDateDisplay: this.formatDateDisplay(startDate),
    });
  },

  onEndDateChange(e: any) {
    const endDate = e.detail.value;
    this.setData({
      endDate,
      endDateDisplay: this.formatDateDisplay(endDate),
    });
  },

  onPreferenceTap(e: any) {
    const value = e.currentTarget.dataset.value;
    const { preferences } = this.data;
    const index = preferences.indexOf(value);

    if (index > -1) {
      preferences.splice(index, 1);
    } else {
      preferences.push(value);
    }
    this.setData({ preferences: [...preferences] });
  },

  onBlindModeSelect(e: any) {
    const value = e.currentTarget.dataset.value;
    this.setData({ blindMode: value === 'true' || value === true });
  },

  calculateDays(): number {
    const { startDate, endDate } = this.data;
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return Math.floor((end - start) / 86400000) + 1;
  },

  validateForm(): boolean {
    const { cityCode, startDate, endDate } = this.data;
    if (!cityCode) {
      wx.showToast({ title: '请选择目的地', icon: 'none' });
      return false;
    }
    if (!startDate || !endDate) {
      wx.showToast({ title: '请选择出行日期', icon: 'none' });
      return false;
    }
    if (this.calculateDays() <= 0) {
      wx.showToast({ title: '结束日期需晚于开始日期', icon: 'none' });
      return false;
    }
    return true;
  },

  buildParams() {
    const {
      provinceCode, cityCode, districtCode,
      provinceName, cityName, districtName,
      startDate, endDate, preferences, blindMode,
    } = this.data;

    const days = this.calculateDays();

    return {
      province: provinceCode,
      city: cityCode,
      district: districtCode,
      provinceName,
      cityName,
      districtName,
      startDate,
      days,
      itineraryName: `${cityName}${days}日游`,
      remark: JSON.stringify({
        preferences,
        blindMode,
        endDate,
      }),
    };
  },

  startProgressAnimation() {
    let index = 0;
    this.setData({ progressText: AI_PROGRESS_TEXTS[0] });
    this._progressTimer = setInterval(() => {
      index = (index + 1) % AI_PROGRESS_TEXTS.length;
      this.setData({ progressText: AI_PROGRESS_TEXTS[index] });
    }, 3000);
  },

  clearProgressTimer() {
    if (this._progressTimer) {
      clearInterval(this._progressTimer);
      this._progressTimer = null;
    }
  },

  async onAIPlan() {
    if (!this.validateForm()) return;
    if (this.data.loading) return;

    this.setData({ loading: true });
    this.startProgressAnimation();
    wx.setKeepScreenOn({ keepScreenOn: true });

    try {
      const params = this.buildParams();
      const res = await autoGenerateItinerary(params);
      const itineraryId = res.data?.itineraryId;

      if (itineraryId) {
        wx.redirectTo({ url: `/pages/itinerary-detail/index?id=${itineraryId}` });
      } else {
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
      }
    } catch (err) {
      console.error('AI plan failed:', err);
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false, progressText: '' });
      this.clearProgressTimer();
      wx.setKeepScreenOn({ keepScreenOn: false });
    }
  },

  async onManualPlan() {
    if (!this.validateForm()) return;
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const params = this.buildParams();
      const res = await addItinerary(params);
      const itineraryId = res.data?.itineraryId;

      if (itineraryId) {
        wx.redirectTo({ url: `/pages/itinerary-detail/index?id=${itineraryId}` });
      } else {
        wx.showToast({ title: '创建失败，请重试', icon: 'none' });
      }
    } catch (err) {
      console.error('Manual plan failed:', err);
      wx.showToast({ title: '创建失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
