import { getDictByType } from '../../services/dict';
import { autoGenerateItinerary, addItinerary } from '../../services/itinerary';
import type { DictData } from '../../types/dict';
import {
  DEFAULT_DISTRICT,
  DEFAULT_DISTRICT_NAME,
  DISTRICT_OPTIONS,
  FIXED_CITY_CODE,
  FIXED_CITY_NAME,
  FIXED_PROVINCE_CODE,
  FIXED_PROVINCE_NAME,
  getOptionCityCode,
  getOptionCityName,
  getOptionDistrictCode,
  getOptionDistrictName,
  getOptionProvinceCode,
  getOptionProvinceName,
  getSelectedDistrict,
  setSelectedDistrict,
  type DistrictOption,
} from '../../utils/district';

const AI_PROGRESS_TEXTS = [
  '正在分析目的地特色...',
  '正在规划最佳路线...',
  '正在匹配优质资源...',
  '正在生成专属行程...',
];

const BLIND_MODE_DESC: Record<string, string> = {
  '0': '行程中除第一个景点外，其他都是盲盒，希望能给您带来小惊喜哦',
  '1': '行程中的每个景点安排都是明确的，支持自主规划哦',
  '2': '所有的行程安排都是盲盒哦，主打随遇而喜哦',
};

Page({
  data: {
    provinceCode: FIXED_PROVINCE_CODE,
    cityCode: FIXED_CITY_CODE,
    districtCode: DEFAULT_DISTRICT,
    provinceName: FIXED_PROVINCE_NAME,
    cityName: FIXED_CITY_NAME,
    districtName: DEFAULT_DISTRICT_NAME,
    /** 当前选中的「当地」选项编码（市级选项与 districtCode 不同，单独记录用于去重判断） */
    districtOptionCode: DEFAULT_DISTRICT,
    /** 目的地展示文案：市级选项没有区县，避免出现「浙江省 杭州市 杭州市」或尾部空格 */
    regionText: `${FIXED_PROVINCE_NAME} ${FIXED_CITY_NAME} ${DEFAULT_DISTRICT_NAME}`,
    districtOptions: DISTRICT_OPTIONS,
    districtIndex: 0,
    startDate: '',
    endDate: '',
    startDateDisplay: '',
    endDateDisplay: '',
    preferences: [] as string[],
    preferenceOptions: [] as DictData[],
    blindMode: '1' as string,
    blindModeDesc: BLIND_MODE_DESC['1'],
    loading: false,
    progressText: '',
    showDatePicker: false,
  },

  _progressTimer: null as any,

  onLoad() {
    // 「当地」以模块加载后的最新选择为准（data 字面量只在模块求值时执行一次）
    this.applyDistrictOption(getSelectedDistrict());
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

  /**
   * 把「当地」选项落到表单地区字段。
   * 县域选项：省市固定丽水市 + district 编码；
   * 市级选项（如杭州市）：city 为自身编码，district 留空由后端按市过滤。
   */
  applyDistrictOption(option: DistrictOption) {
    const index = DISTRICT_OPTIONS.findIndex((o) => o.code === option.code);
    const provinceName = getOptionProvinceName(option);
    const cityName = getOptionCityName(option);
    const districtName = getOptionDistrictName(option);
    this.setData({
      districtIndex: index >= 0 ? index : 0,
      districtOptionCode: option.code,
      provinceCode: getOptionProvinceCode(option),
      cityCode: getOptionCityCode(option),
      districtCode: getOptionDistrictCode(option),
      provinceName,
      cityName,
      districtName,
      regionText: [provinceName, cityName, districtName].filter(Boolean).join(' '),
    });
  },

  // 地区切换；与首页「当地」共享同一份持久化选择
  onDistrictChange(e: any) {
    const index = Number(e?.detail?.value);
    const option = DISTRICT_OPTIONS[index];
    if (!option || option.code === this.data.districtOptionCode) return;
    this.applyDistrictOption(option);
    setSelectedDistrict(option.code);
  },

  onDateTap() {
    this.setData({ showDatePicker: true });
  },

  onCloseDatePicker() {
    this.setData({ showDatePicker: false });
  },

  onDateConfirm(e: any) {
    const { startDate, endDate, startDateDisplay, endDateDisplay } = e.detail;
    this.setData({
      startDate,
      endDate,
      startDateDisplay,
      endDateDisplay,
      showDatePicker: false,
    });
  },

  onPreferenceToggle(e: any) {
    const value = e.currentTarget.dataset.value;
    if (!value) return;

    const preferences = this.data.preferences || [];
    const nextPreferences = preferences.includes(value)
      ? preferences.filter((item) => item !== value)
      : [...preferences, value];

    this.setData({ preferences: nextPreferences });
  },

  onPreferenceTap(e: any) {
    this.onPreferenceToggle(e);
  },

  onBlindModeSelect(e: any) {
    const value = e.currentTarget.dataset.value;
    this.setData({ blindMode: value, blindModeDesc: BLIND_MODE_DESC[value] || '' });
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
      preferences,
      blindMode,
      endDate,
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
      const params = {
        ...this.buildParams(),
        blindMode: '1',
      };
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
