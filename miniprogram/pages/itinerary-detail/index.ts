import {
  getItinerary,
  getItineraryList,
  autoGenerateItinerary,
  editItinerary,
  updateDayAttractions,
  reorderDayAttractions,
  resetDayAttractions,
  removeDayAccommodation,
  removeDayDining,
  removeDayCar,
  removeDayPhotography,
  unlockAttraction,
  skipAttraction,
  forceUnlockAttraction,
} from '../../services/itinerary';
import { pushPendingUnlock, startNetworkWatcher } from '../../utils/blind-unlock-queue';
import { getTemplateDetail } from '../../services/template';
import { getLocalSpecialtyList } from '../../services/local-specialty';
import { getWeatherForecast } from '../../services/weather';
import type { WeatherDay } from '../../services/weather';
import type { Itinerary, TravelItineraryDay } from '../../types/itinerary';
import type { TravelAttraction } from '../../types/attraction';
import type { TravelLocalSpecialtyDish } from '../../types/local-specialty';

const DRAWER_LEVELS = [20, 60, 80] as const;
const DEFAULT_DRAWER_HEIGHT = 60;
const DRAWER_FLING_THRESHOLD = 0.35;
const MAP_SCALE_BOOST = 2;
const MAX_MAP_SCALE = 20;
const MAP_FOCUS_SCREEN_OFFSET_RATIO = 0.28;

let drawerWindowHeight = 1;
let drawerTouchActive = false;
let drawerTouchStartY = 0;
let drawerTouchStartHeight = DEFAULT_DRAWER_HEIGHT;
let drawerLastTouchY = 0;
let drawerLastTouchTime = 0;
let drawerVelocityY = 0;

// 拖拽排序状态
let dragLongPressTimer: ReturnType<typeof setTimeout> | null = null;
let dragTouchStartX = 0;
let dragTouchStartY = 0;
let dragSaveRequestTask: WechatMiniprogram.RequestTask | null = null;
let dragPreReorderList: any[] | null = null;

function clampDrawerHeight(height: number) {
  return Math.min(DRAWER_LEVELS[2], Math.max(DRAWER_LEVELS[0], height));
}

function getNearestDrawerLevel(height: number) {
  return DRAWER_LEVELS.reduce((nearest, level) =>
    Math.abs(level - height) < Math.abs(nearest - height) ? level : nearest,
  );
}

function getDrawerLevelIndex(level: number) {
  const index = DRAWER_LEVELS.findIndex((item) => item === level);
  return index >= 0 ? index : 1;
}

function getLatitudeOffsetForMapFocus(latitude: number, scale: number) {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const degreesPerPixel =
    (360 * Math.cos(latitudeRadians)) / (256 * Math.pow(2, scale));

  return degreesPerPixel * drawerWindowHeight * MAP_FOCUS_SCREEN_OFFSET_RATIO;
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

function formatDateRange(startDate?: string, days?: number) {
  const start = parseLocalDate(startDate);
  if (!start || !days || days <= 0) return '选择出行日期';

  const end = new Date(start.getTime());
  end.setDate(start.getDate() + days - 1);

  return `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getEndDate(startDate?: string, days?: number) {
  const start = parseLocalDate(startDate);
  if (!start || !days || days <= 0) return '';

  const end = new Date(start.getTime());
  end.setDate(start.getDate() + days - 1);
  return formatInputDate(end);
}

type FlexibleItineraryDay = TravelItineraryDay & {
  attractions?: TravelAttraction[];
};

const ATTRACTION_DETAIL_FIELDS: Array<keyof TravelAttraction> = [
  'attractionName',
  'attractionShortName',
  'attractionDescription',
  'attractionBlurb',
  'classicRating',
  'leisureRating',
  'visitDuration',
  'openTime',
  'familyFriendly',
  'ticketPriceA',
  'ticketPriceC',
  'reservationRequired',
  'perCost',
  'indoorOutdoor',
  'closedDay',
  'specialPeriod',
  'badFactors',
  'attractionType',
  'latitude',
  'longitude',
  'attachments',
];

function hasMeaningfulValue(value: unknown) {
  return value !== undefined && value !== null && value !== '';
}

function formatVisitDuration(value: unknown) {
  if (!hasMeaningfulValue(value)) return '';
  const text = String(value).trim();
  if (!text) return '';
  if (/[时分天]/.test(text)) return text;
  if (/^\d+(\.\d+)?$/.test(text)) return `${text}小时`;
  if (/^\d+(\.\d+)?\s*[-~～—–至到]\s*\d+(\.\d+)?$/.test(text)) {
    return `${text.replace(/\s*([-~～—–至到])\s*/g, '$1')}小时`;
  }
  return text;
}

function formatClassicRating(value: unknown) {
  if (!hasMeaningfulValue(value)) return '';
  const text = String(value).trim();
  if (!text) return '';
  return /星$/.test(text) ? text : `${text}星`;
}

function formatLeisureRating(value: unknown) {
  if (!hasMeaningfulValue(value)) return '';
  const text = String(value).trim();
  const normalized = Number(text);
  const map: Record<string, string> = {
    '0.6': '轻松',
    '0.8': '休闲',
    '1': '中等强度',
    '1.5': '高等强度',
    '2': '暴虐强度',
  };
  return Number.isFinite(normalized) ? map[String(normalized)] || text : text;
}

function mergeMissingAttractionDetails<T extends Record<string, any>>(
  target: T,
  source?: TravelAttraction,
) {
  if (!source) return target;

  const merged: Record<string, any> = { ...target };
  ATTRACTION_DETAIL_FIELDS.forEach((field) => {
    if (!hasMeaningfulValue(merged[field]) && hasMeaningfulValue(source[field])) {
      merged[field] = source[field];
    }
  });
  if (hasMeaningfulValue(merged.visitDuration)) {
    merged.visitDuration = formatVisitDuration(merged.visitDuration);
  }
  if (hasMeaningfulValue(merged.durationHint)) {
    merged.durationHint = formatVisitDuration(merged.durationHint);
  }
  if (hasMeaningfulValue(merged.classicRating)) {
    merged.classicRatingText = formatClassicRating(merged.classicRating);
  }
  if (hasMeaningfulValue(merged.leisureRating)) {
    merged.leisureRatingText = formatLeisureRating(merged.leisureRating);
  }
  return merged as T;
}

function buildAttractionMap(attractions: TravelAttraction[]) {
  return attractions.reduce<Record<string, TravelAttraction>>((map, item) => {
    if (item.attractionId !== undefined && item.attractionId !== null) {
      map[String(item.attractionId)] = item;
    }
    return map;
  }, {});
}

function normalizeAttractionList(day: FlexibleItineraryDay) {
  if (Array.isArray(day.attractionList)) return day.attractionList;
  if (Array.isArray(day.touristAttractionList)) return day.touristAttractionList;
  if (Array.isArray(day.attractions)) return day.attractions;
  return [];
}

function normalizeItineraryDay(day: FlexibleItineraryDay): TravelItineraryDay {
  const attractionList = normalizeAttractionList(day).map((item) => ({
    ...item,
    visitDuration: formatVisitDuration(item.visitDuration),
    classicRatingText: formatClassicRating(item.classicRating),
    leisureRatingText: formatLeisureRating(item.leisureRating),
  }));
  const attractionMap = buildAttractionMap(attractionList);
  const blindAttractions = ((day.blindAttractions || []) as any[]).map((item) =>
    mergeMissingAttractionDetails(item, attractionMap[String(item.attractionId)]),
  );

  return {
    ...day,
    attractionList,
    blindAttractions,
  };
}

function normalizeItineraryDays(days?: FlexibleItineraryDay[]) {
  return (days || []).map(normalizeItineraryDay);
}

function normalizeItineraryDisplay(itinerary: Itinerary): Itinerary {
  return {
    ...itinerary,
    dateRangeText: formatDateRange(itinerary.startDate, itinerary.days),
    daysList: normalizeItineraryDays(itinerary.daysList as FlexibleItineraryDay[] | undefined),
  };
}

type DiningIntroMeal = 'breakfast' | 'lunch' | 'dinner';

type DiningIntroPathItem = {
  type: 'attraction' | 'dining' | 'hotel';
  title: string;
  meta: string;
  active?: boolean;
};

function getDiningMealText(meal?: string) {
  if (meal === 'breakfast') return '早餐';
  if (meal === 'dinner') return '晚餐';
  return '午餐';
}

function getDiningMealTime(meal?: string) {
  if (meal === 'breakfast') return '08:30';
  if (meal === 'dinner') return '18:30';
  return '12:30';
}

function normalizeIntroDataWithAttractionName(
  data: unknown,
  dayData: TravelItineraryDay | null,
) {
  const source =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const rawAttractionName = source.attractionName;
  const attractionName =
    typeof rawAttractionName === 'string' ? rawAttractionName.trim() : '';
  if (attractionName) return source;

  const fallbackAttractionName =
    dayData?.attractionList?.[0]?.attractionName?.trim();
  if (!fallbackAttractionName) return source;

  return {
    ...source,
    attractionName: fallbackAttractionName,
  };
}

function buildDiningIntroData(
  data: unknown,
  meal: DiningIntroMeal | undefined,
  dayData: TravelItineraryDay | null,
) {
  const source = normalizeIntroDataWithAttractionName(data, dayData);
  const pathItems: DiningIntroPathItem[] = [];
  const firstAttraction = dayData?.attractionList?.[0];
  const accommodation = dayData?.accommodation;

  if (firstAttraction?.attractionName) {
    pathItems.push({
      type: 'attraction',
      title: firstAttraction.attractionShortName || firstAttraction.attractionName,
      meta: firstAttraction.visitDuration
        ? `建议游玩 ${firstAttraction.visitDuration}`
        : '行程景点',
    });
  }

  pathItems.push({
    type: 'dining',
    title: typeof source.diningName === 'string' ? source.diningName : '餐饮安排',
    meta: `${getDiningMealText(meal)} · ${getDiningMealTime(meal)}`,
    active: true,
  });

  if (accommodation?.accommodationName) {
    pathItems.push({
      type: 'hotel',
      title: accommodation.accommodationName,
      meta: '入住安排',
    });
  }

  return {
    ...source,
    __meal: meal || 'lunch',
    __pathItems: pathItems,
  };
}

function getDiningShareTitle(data: unknown) {
  const dining = data as { diningName?: string; avgCost?: number | string } | null;
  const name = typeof dining?.diningName === 'string' ? dining.diningName.trim() : '';
  const avgCost =
    dining?.avgCost === undefined || dining?.avgCost === null
      ? ''
      : String(dining.avgCost).trim();

  if (!name) return '推荐一家旅行餐厅';
  return avgCost ? `${name} · 人均¥${avgCost}` : `推荐餐厅：${name}`;
}

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
    weatherList: [] as WeatherDay[],
    currentDayWeather: null as WeatherDay | null,
    mapMarkers: [] as any[],
    mapPolyline: [] as any[],
    mapCircles: [] as any[],
    mapCenter: { latitude: 28.45, longitude: 119.92 },
    mapScale: 12,
    drawerHeight: DEFAULT_DRAWER_HEIGHT,
    drawerHeightLevel: DEFAULT_DRAWER_HEIGHT,
    drawerDragging: false,
    showDatePicker: false,
    datePickerEndDate: '',
    blindAttractions: [] as any[],
    unlockingAttractionId: null as number | null,
    forceUnlockCountdown: '' as string,
    isDragging: false,
    dragIndex: -1,
    dragOffsetY: 0,
  },

  onLoad(options: Record<string, string | undefined>) {
    const systemInfo = wx.getSystemInfoSync();
    drawerWindowHeight = systemInfo.windowHeight || 1;

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

    startNetworkWatcher(async (item) => {
      try {
        await unlockAttraction(item.itineraryId, item.dayId, item.attractionId, {
          latitude: item.latitude,
          longitude: item.longitude,
          accuracy: 50,
        });
        return true;
      } catch {
        return false;
      }
    });
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
          attractionList: normalizeAttractionList(d),
          breakfast: d.breakfast || null,
          lunch: d.lunch || null,
          dinner: d.dinner || null,
          accommodation: d.accommodation || null,
          photography: d.photography || null,
          car: d.car || null,
        }),
      ).map(normalizeItineraryDay);

      const itinerary: Itinerary = normalizeItineraryDisplay({
        itineraryId: 0,
        templateId,
        itineraryName: template.templateName,
        province: template.province,
        provinceName: template.provinceName,
        city: template.city,
        cityName: template.cityName,
        district: template.district,
        districtName: template.districtName,
        days: template.baseDays || daysList.length,
        status: '0',
        daysList,
      });

      const currentDayData =
        daysList.find((d) => d.dayNumber === currentDay) || daysList[0] || null;

      this.setData({
        itinerary,
        currentDayData,
        currentDay: currentDayData?.dayNumber || 1,
        loading: false,
      });

      this.updateMapData(currentDayData);

      this.loadLocalSpecialty(
        template.province,
        template.city,
        template.district,
      );

      this.loadWeather(
        template.cityName || template.city,
        itinerary.days,
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
    const { itineraryId, currentDay, itinerary: existingItinerary } = this.data;
    const isInitialLoad = !existingItinerary;
    if (isInitialLoad) {
      this.setData({ loading: true });
    }

    try {
      const res = await getItinerary(itineraryId);
      const itinerary = res.data;

      if (!itinerary) {
        wx.showToast({ title: '行程数据为空', icon: 'none' });
        return;
      }

      const normalizedItinerary = normalizeItineraryDisplay(itinerary);
      const daysList = normalizedItinerary.daysList || [];
      const currentDayData =
        daysList.find((d) => d.dayNumber === currentDay) || daysList[0] || null;
      const blindAttractions = (currentDayData as any)?.blindAttractions || [];

      this.setData({
        itinerary: normalizedItinerary,
        currentDayData,
        currentDay: currentDayData?.dayNumber || 1,
        loading: false,
        blindAttractions,
      });

      this.updateMapData(currentDayData);

      this.loadLocalSpecialty(
        normalizedItinerary.province,
        normalizedItinerary.city,
        normalizedItinerary.district,
      );

      this.loadWeather(
        normalizedItinerary.cityName || normalizedItinerary.city,
        normalizedItinerary.days,
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

  async loadWeather(cityName?: string, days?: number) {
    if (!cityName) return;
    try {
      const res = await getWeatherForecast({
        city: cityName,
        days: Math.min(days || 7, 7),
      });
      const weatherList = res.data || [];
      const { currentDay, itinerary } = this.data;
      const currentDayWeather = this.matchWeatherForDay(
        weatherList,
        currentDay,
        itinerary?.startDate,
      );
      this.setData({ weatherList, currentDayWeather });
    } catch (err) {
      console.error('Failed to load weather:', err);
    }
  },

  matchWeatherForDay(
    weatherList: WeatherDay[],
    dayNumber: number,
    startDate?: string,
  ): WeatherDay | null {
    if (!weatherList.length) return null;
    if (!startDate) {
      return weatherList[dayNumber - 1] || null;
    }
    const start = parseLocalDate(startDate);
    if (!start) return weatherList[dayNumber - 1] || null;

    const targetDate = new Date(start.getTime());
    targetDate.setDate(start.getDate() + dayNumber - 1);
    const targetStr = formatInputDate(targetDate);

    return weatherList.find((w) => w.date === targetStr) || weatherList[dayNumber - 1] || null;
  },

  onDayTap(e: any) {
    const dayNumber = e.currentTarget.dataset.day;
    const { itinerary, weatherList } = this.data;
    const daysList = itinerary?.daysList || [];
    const currentDayData =
      daysList.find((d) => d.dayNumber === dayNumber) || null;
    const currentDayWeather = this.matchWeatherForDay(
      weatherList,
      dayNumber,
      itinerary?.startDate,
    );
    const blindAttractions = (currentDayData as any)?.blindAttractions || [];

    this.setData({ currentDay: dayNumber, currentDayData, currentDayWeather, blindAttractions });
    this.updateMapData(currentDayData);
  },

  onAddSpot() {
    const { currentDay, showIntroDrawer } = this.data;
    if (showIntroDrawer) return; // 抽屉互斥
    this.setData({ showAddDrawer: true, addDayNumber: currentDay });
  },

  onCardDetail(e: any) {
    const { type, data, meal } = e.detail;
    const { showAddDrawer, currentDayData } = this.data;
    if (showAddDrawer) return; // 抽屉互斥
    const introData =
      type === 'dining'
        ? buildDiningIntroData(data, meal, currentDayData)
        : normalizeIntroDataWithAttractionName(data, currentDayData);
    this.setData({
      showIntroDrawer: type,
      introData,
    });
  },

  onCardDelete(e: any) {
    const { type, data, meal } = e.detail;
    const { isTemplate } = this.data;
    if (isTemplate) return;

    const typeLabels: Record<string, string> = {
      attraction: '景点',
      hotel: '住宿',
      dining: '餐饮',
      car: '包车',
      photography: '跟拍',
    };

    wx.showModal({
      title: '确认删除',
      content: `确定删除该${typeLabels[type] || '项目'}吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doDelete(type, data, meal);
        }
      },
    });
  },

  async doDelete(type: string, data: any, meal?: string) {
    const { itineraryId, currentDay, currentDayData } = this.data;
    wx.showLoading({ title: '删除中...' });

    try {
      if (type === 'attraction') {
        const currentIds = (currentDayData?.attractionList || [])
          .map((a: any) => a.attractionId)
          .filter((id: number) => id != null && String(id) !== String(data.attractionId));
        await updateDayAttractions({
          itineraryId,
          dayNumber: currentDay,
          attractionIds: currentIds.join(','),
          replace: true,
        });
      } else if (type === 'hotel') {
        await removeDayAccommodation(itineraryId, currentDay);
      } else if (type === 'dining') {
        if (!meal || !['breakfast', 'lunch', 'dinner'].includes(meal)) {
          wx.hideLoading();
          wx.showToast({ title: '删除失败：未知餐次', icon: 'none' });
          return;
        }
        await removeDayDining(itineraryId, currentDay, meal);
      } else if (type === 'car') {
        await removeDayCar(itineraryId, currentDay);
      } else if (type === 'photography') {
        await removeDayPhotography(itineraryId, currentDay);
      }

      wx.hideLoading();
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadItinerary();
    } catch (err) {
      console.error('Failed to delete:', err);
      wx.hideLoading();
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  onDateMetaTap() {
    const { itinerary, isTemplate } = this.data;
    if (isTemplate) {
      wx.showToast({ title: '模板暂不支持设置日期', icon: 'none' });
      return;
    }

    this.setData({
      showDatePicker: true,
      datePickerEndDate: getEndDate(itinerary?.startDate, itinerary?.days),
    });
  },

  onDatePickerClose() {
    this.setData({ showDatePicker: false });
  },

  async onDateConfirm(e: any) {
    const { itineraryId, itinerary } = this.data;
    const { startDate, days } = e.detail;
    if (!itineraryId || !itinerary) return;

    wx.showLoading({ title: '保存中...' });
    try {
      await editItinerary({ itineraryId, startDate, days });
      const nextItinerary = normalizeItineraryDisplay({
        ...itinerary,
        startDate,
        days,
      });

      this.setData({
        itinerary: nextItinerary,
        showDatePicker: false,
        datePickerEndDate: getEndDate(startDate, days),
      });
      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      console.error('Failed to update itinerary date:', err);
      wx.hideLoading();
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
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

  onInfoCardTap() {
    if (this.data.drawerHeightLevel === 20) {
      this.setData({
        drawerHeight: 60,
        drawerHeightLevel: 60,
      });
    }
  },

  onDrawerTouchStart(e: any) {
    if (drawerTouchActive) return;

    const touch = e.touches?.[0];
    if (!touch) return;

    drawerTouchActive = true;
    drawerTouchStartY = touch.clientY;
    drawerTouchStartHeight = this.data.drawerHeight;
    drawerLastTouchY = touch.clientY;
    drawerLastTouchTime = Date.now();
    drawerVelocityY = 0;

    this.setData({ drawerDragging: true });
  },

  onDrawerTouchMove(e: any) {
    if (!drawerTouchActive) return;

    const touch = e.touches?.[0];
    if (!touch) return;

    const now = Date.now();
    const deltaY = touch.clientY - drawerTouchStartY;
    const nextHeight = clampDrawerHeight(
      drawerTouchStartHeight - (deltaY / drawerWindowHeight) * 100,
    );
    const elapsed = Math.max(now - drawerLastTouchTime, 1);

    drawerVelocityY = (touch.clientY - drawerLastTouchY) / elapsed;
    drawerLastTouchY = touch.clientY;
    drawerLastTouchTime = now;

    this.setData({ drawerHeight: Number(nextHeight.toFixed(2)) });
  },

  onDrawerTouchEnd() {
    if (!drawerTouchActive) return;

    drawerTouchActive = false;

    const nearestLevel = getNearestDrawerLevel(this.data.drawerHeight);
    let targetLevel = nearestLevel;

    if (Math.abs(drawerVelocityY) > DRAWER_FLING_THRESHOLD) {
      const nearestIndex = getDrawerLevelIndex(nearestLevel);
      const flingDirection = drawerVelocityY < 0 ? 1 : -1;
      const targetIndex = Math.min(
        DRAWER_LEVELS.length - 1,
        Math.max(0, nearestIndex + flingDirection),
      );
      targetLevel = DRAWER_LEVELS[targetIndex];
    }

    this.setData({
      drawerHeight: targetLevel,
      drawerHeightLevel: targetLevel,
      drawerDragging: false,
    });
  },

  async updateMapData(dayData: TravelItineraryDay | null) {
    if (!dayData || !dayData.attractionList || dayData.attractionList.length === 0) {
      this.setData({ mapMarkers: [], mapPolyline: [], mapCircles: [] });
      return;
    }

    const blindAttractions = this.data.blindAttractions || [];

    const attractions = dayData.attractionList.filter(
      (a) => a.latitude && a.longitude,
    );

    if (attractions.length === 0 && blindAttractions.length === 0) {
      this.setData({ mapMarkers: [], mapPolyline: [], mapCircles: [] });
      return;
    }

    let markers: any[] = [];
    let mapScale = 12;
    let mapCenter = { latitude: 0, longitude: 0 };

    if (attractions.length > 0) {
      markers = attractions.map((a, idx) => ({
        id: idx,
        latitude: a.latitude!,
        longitude: a.longitude!,
        iconPath: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/marker-pin.png?x-oss-process=image/resize,m_lfit,w_56,h_56',
        width: 28,
        height: 28,
        anchor: { x: 0.5, y: 1 },
        callout: {
          content: a.attractionName || '',
          display: 'ALWAYS',
          fontSize: 11,
          borderRadius: 6,
          padding: 6,
          bgColor: '#ffffff',
          color: '#163422',
          borderWidth: 1,
          borderColor: '#e0e0e0',
        },
        label: {
          content: String(idx + 1),
          color: '#ffffff',
          fontSize: 10,
          anchorX: 0,
          anchorY: -24,
          textAlign: 'center',
        },
      }));

      let latSum = 0;
      let lngSum = 0;
      attractions.forEach((a) => {
        latSum += a.latitude!;
        lngSum += a.longitude!;
      });
      const routeCenter = {
        latitude: latSum / attractions.length,
        longitude: lngSum / attractions.length,
      };

      if (attractions.length >= 2) {
        const lats = attractions.map((a) => a.latitude!);
        const lngs = attractions.map((a) => a.longitude!);
        const latDiff = Math.max(...lats) - Math.min(...lats);
        const lngDiff = Math.max(...lngs) - Math.min(...lngs);
        const maxDiff = Math.max(latDiff, lngDiff);
        if (maxDiff > 0.5) mapScale = 9;
        else if (maxDiff > 0.2) mapScale = 10;
        else if (maxDiff > 0.1) mapScale = 11;
        else if (maxDiff > 0.05) mapScale = 12;
        else mapScale = 13;
      }
      mapScale = Math.min(MAX_MAP_SCALE, mapScale + MAP_SCALE_BOOST);

      mapCenter = {
        latitude:
          routeCenter.latitude -
          getLatitudeOffsetForMapFocus(routeCenter.latitude, mapScale),
        longitude: routeCenter.longitude,
      };
    } else if (blindAttractions.length > 0) {
      // 全盲模式：用 fuzzy 坐标计算地图中心
      const fuzzyPoints = blindAttractions.filter((ba: any) => ba.fuzzyLatitude && ba.fuzzyLongitude);
      if (fuzzyPoints.length > 0) {
        let latSum = 0;
        let lngSum = 0;
        fuzzyPoints.forEach((ba: any) => {
          latSum += ba.fuzzyLatitude;
          lngSum += ba.fuzzyLongitude;
        });
        const routeCenter = {
          latitude: latSum / fuzzyPoints.length,
          longitude: lngSum / fuzzyPoints.length,
        };

        if (fuzzyPoints.length >= 2) {
          const lats = fuzzyPoints.map((ba: any) => ba.fuzzyLatitude);
          const lngs = fuzzyPoints.map((ba: any) => ba.fuzzyLongitude);
          const latDiff = Math.max(...lats) - Math.min(...lats);
          const lngDiff = Math.max(...lngs) - Math.min(...lngs);
          const maxDiff = Math.max(latDiff, lngDiff);
          if (maxDiff > 0.5) mapScale = 9;
          else if (maxDiff > 0.2) mapScale = 10;
          else if (maxDiff > 0.1) mapScale = 11;
          else if (maxDiff > 0.05) mapScale = 12;
          else mapScale = 13;
        }
        mapScale = Math.min(MAX_MAP_SCALE, mapScale + MAP_SCALE_BOOST);

        mapCenter = {
          latitude:
            routeCenter.latitude -
            getLatitudeOffsetForMapFocus(routeCenter.latitude, mapScale),
          longitude: routeCenter.longitude,
        };
      }
    }

    this.setData({ mapMarkers: markers, mapPolyline: [], mapCenter, mapScale });

    // Build circles and markers for blind attractions
    const mapCircles: any[] = [];
    const blindMarkers: any[] = [];
    let blindIndex = 0;

    blindAttractions.forEach((ba: any) => {
      if ((ba.blindDisplayMode === 'next' || ba.blindDisplayMode === 'locked') && ba.fuzzyLatitude && ba.fuzzyLongitude) {
        blindIndex++;
        mapCircles.push({
          latitude: ba.fuzzyLatitude,
          longitude: ba.fuzzyLongitude,
          radius: ba.fuzzyRadius || 500,
          fillColor: 'rgba(0, 0, 0, 0.06)',
          strokeColor: 'rgba(0, 0, 0, 0.15)',
          strokeWidth: 1,
        });
        const distanceKm = ba.fuzzyRadius ? (ba.fuzzyRadius / 1000).toFixed(1) : '?';
        blindMarkers.push({
          id: 9000 + ba.attractionId,
          latitude: ba.fuzzyLatitude,
          longitude: ba.fuzzyLongitude,
          iconPath: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/marker-pin.png?x-oss-process=image/resize,m_lfit,w_56,h_56',
          width: 28,
          height: 28,
          anchor: { x: 0.5, y: 1 },
          callout: {
            content: '神秘地点 0' + blindIndex + '\n到达后揭晓 · 约' + distanceKm + 'km',
            display: 'ALWAYS',
            fontSize: 11,
            borderRadius: 6,
            padding: 6,
            bgColor: '#ffffff',
            color: '#163422',
            borderWidth: 1,
            borderColor: '#e0e0e0',
          },
        });
      }
    });

    // If we have blind attractions, replace the standard markers with a filtered set
    if (blindAttractions.length > 0) {
      const visibleMarkers = markers.filter((_: any, idx: number) => {
        const attraction = attractions[idx];
        const ba = blindAttractions.find((b: any) => b.attractionId === attraction?.attractionId);
        return !ba || ba.blindDisplayMode === 'visible' || ba.blindDisplayMode === 'unlocked';
      });
      this.setData({ mapMarkers: visibleMarkers.concat(blindMarkers), mapCircles });
    } else {
      this.setData({ mapCircles: [] });
    }

    // Build polyline: use fuzzy coords for blind attractions, dashed style
    if (blindAttractions.length > 0) {
      const polylinePoints: any[] = [];
      blindAttractions.forEach((ba: any) => {
        if (ba.blindDisplayMode === 'visible' || ba.blindDisplayMode === 'unlocked') {
          if (ba.longitude && ba.latitude) {
            polylinePoints.push({ latitude: ba.latitude, longitude: ba.longitude });
          }
        } else if (ba.blindDisplayMode === 'next' || ba.blindDisplayMode === 'locked') {
          if (ba.fuzzyLatitude && ba.fuzzyLongitude) {
            polylinePoints.push({ latitude: ba.fuzzyLatitude, longitude: ba.fuzzyLongitude });
          }
        }
      });
      if (polylinePoints.length >= 2) {
        this.setData({
          mapPolyline: [{
            points: polylinePoints,
            color: '#163422',
            width: 5,
            arrowLine: true,
            dottedLine: true,
          }],
        });
      } else {
        this.setData({ mapPolyline: [] });
      }
    } else if (attractions.length >= 2) {
      const stops = attractions.map((a) => ({
        latitude: a.latitude!,
        longitude: a.longitude!,
      }));
      this.setData({
        mapPolyline: [{
          points: stops,
          color: '#163422',
          width: 6,
          arrowLine: true,
        }],
      });
    } else {
      this.setData({ mapPolyline: [] });
    }
  },

  // ======================== 拖拽排序 ========================

  _getDragAttractionList() {
    const blindAttractions = this.data.blindAttractions || [];
    if (blindAttractions.length > 0) return blindAttractions;
    return this.data.currentDayData?.attractionList || [];
  },

  onAttractionTouchStart(e: any) {
    const { isTemplate, isDragging } = this.data;
    if (isTemplate || isDragging) return;

    const { index } = e.currentTarget.dataset;
    const attractions = this._getDragAttractionList();
    if (attractions.length <= 1) return;

    dragTouchStartX = e.touches[0].clientX;
    dragTouchStartY = e.touches[0].clientY;

    dragLongPressTimer = setTimeout(() => {
      wx.vibrateShort({ type: 'medium' });
      drawerTouchActive = false;
      dragPreReorderList = [...attractions];
      this.setData({
        isDragging: true,
        dragIndex: index,
      });
    }, 500);
  },

  onAttractionTouchMove(e: any) {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - dragTouchStartX);
    const dy = Math.abs(touch.clientY - dragTouchStartY);

    // Cancel long-press if moved beyond threshold before drag starts
    if (dragLongPressTimer && (dx > 10 || dy > 10)) {
      clearTimeout(dragLongPressTimer);
      dragLongPressTimer = null;
      return;
    }

    // During active drag: update visual position
    if (this.data.isDragging) {
      const deltaY = touch.clientY - dragTouchStartY;
      this.setData({ dragOffsetY: deltaY });
    }
  },

  onAttractionTouchEnd() {
    if (dragLongPressTimer) {
      clearTimeout(dragLongPressTimer);
      dragLongPressTimer = null;
    }

    if (!this.data.isDragging) return;

    const { dragIndex, dragOffsetY } = this.data;
    const CARD_HEIGHT = 80;
    const attractions = this._getDragAttractionList();

    let toIndex = Math.round((dragOffsetY || 0) / CARD_HEIGHT) + dragIndex;
    toIndex = Math.max(0, Math.min(toIndex, attractions.length - 1));

    this.setData({ isDragging: false, dragOffsetY: 0, dragIndex: -1 });

    this.onDragComplete({ fromIndex: dragIndex, toIndex });
  },

  onDragComplete(e: any) {
    const { fromIndex, toIndex } = e;

    if (fromIndex === toIndex || fromIndex == null || toIndex == null) {
      dragPreReorderList = null;
      return;
    }

    const blindAttractions = this.data.blindAttractions || [];
    const isBlindMode = blindAttractions.length > 0;

    if (isBlindMode) {
      const reordered = [...blindAttractions];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      this.setData({ blindAttractions: reordered });
      this.updateMapData(this.data.currentDayData);

      const { itineraryId, currentDay } = this.data;
      const newOrder = reordered.map((a: any) => a.attractionId).join(',');

      if (dragSaveRequestTask) { dragSaveRequestTask.abort(); }
      dragSaveRequestTask = null;
      reorderDayAttractions(itineraryId, currentDay, newOrder)
        .then(() => { dragPreReorderList = null; dragSaveRequestTask = null; })
        .catch(() => {
          if (dragPreReorderList) {
            this.setData({ blindAttractions: dragPreReorderList as any[] });
            this.updateMapData(this.data.currentDayData);
            dragPreReorderList = null;
          }
          dragSaveRequestTask = null;
          wx.showToast({ title: '保存失败，已恢复', icon: 'none' });
        });
    } else {
      const attractions = [...(this.data.currentDayData?.attractionList || [])];
      const [moved] = attractions.splice(fromIndex, 1);
      attractions.splice(toIndex, 0, moved);

      const currentDayData = { ...this.data.currentDayData, attractionList: attractions };
      this.setData({ currentDayData });
      this.updateMapPolyline(attractions);

      const { itineraryId, currentDay } = this.data;
      const newOrder = attractions.map((a: any) => a.attractionId).join(',');

      if (dragSaveRequestTask) { dragSaveRequestTask.abort(); }
      dragSaveRequestTask = null;
      reorderDayAttractions(itineraryId, currentDay, newOrder)
        .then(() => { dragPreReorderList = null; dragSaveRequestTask = null; })
        .catch(() => {
          if (dragPreReorderList) {
            const rollbackData = { ...this.data.currentDayData, attractionList: dragPreReorderList };
            this.setData({ currentDayData: rollbackData });
            this.updateMapPolyline(dragPreReorderList);
            dragPreReorderList = null;
          }
          dragSaveRequestTask = null;
          wx.showToast({ title: '保存失败，已恢复', icon: 'none' });
        });
    }
  },

  async onResetOrder() {
    const { itineraryId, currentDay, isTemplate } = this.data;
    if (isTemplate) return;

    try {
      await resetDayAttractions(itineraryId, currentDay);
      wx.showToast({ title: '已恢复推荐顺序', icon: 'success' });
      this.loadItinerary();
    } catch {
      wx.showToast({ title: '恢复失败', icon: 'none' });
    }
  },

  updateMapPolyline(attractions: any[]) {
    const validAttractions = (attractions || []).filter(
      (a: any) => a.latitude != null && a.longitude != null,
    );

    const markers = validAttractions.map((a: any, idx: number) => ({
      id: a.attractionId,
      latitude: a.latitude,
      longitude: a.longitude,
      iconPath: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/marker-pin.png?x-oss-process=image/resize,m_lfit,w_56,h_56',
      width: 28,
      height: 28,
      anchor: { x: 0.5, y: 1 },
      callout: {
        content: a.attractionShortName || a.attractionName || '',
        display: 'ALWAYS',
        fontSize: 11,
        borderRadius: 6,
        padding: 6,
        bgColor: '#ffffff',
        color: '#163422',
        borderWidth: 1,
        borderColor: '#e0e0e0',
      },
      label: {
        content: String(idx + 1),
        color: '#ffffff',
        fontSize: 10,
        anchorX: 0,
        anchorY: -24,
        textAlign: 'center',
      },
    }));

    const polyline = validAttractions.length >= 2
      ? [{
          points: validAttractions.map((a: any) => ({
            latitude: a.latitude,
            longitude: a.longitude,
          })),
          color: '#163422',
          width: 6,
          arrowLine: true,
        }]
      : [];

    this.setData({ mapMarkers: markers, mapPolyline: polyline });
  },

  // ======================== 盲游模式 ========================

  async onAttractionUnlock(e: any) {
    const { attractionId } = e.detail;
    const { itineraryId, currentDayData } = this.data;
    const dayId = (currentDayData as any)?.itineraryDayId;
    if (!dayId || !attractionId) return;

    this.setData({ unlockingAttractionId: attractionId });

    try {
      const locationRes: any = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: resolve,
          fail: reject,
        });
      });

      const { latitude, longitude, accuracy } = locationRes;

      try {
        await unlockAttraction(itineraryId, dayId, attractionId, { latitude, longitude, accuracy });
        wx.showToast({ title: '解锁成功！', icon: 'success' });
        this.loadItinerary();
      } catch (err: any) {
        if (err.message && err.message.includes('距离目的地')) {
          wx.showToast({ title: err.message, icon: 'none', duration: 3000 });
        } else if (err.message && err.message.includes('定位精度不足')) {
          wx.showToast({ title: '定位精度不足，请到开阔地带重试', icon: 'none' });
        } else if (err.message && err.message.includes('操作过于频繁')) {
          wx.showToast({ title: err.message, icon: 'none' });
        } else {
          // Offline: save to queue
          pushPendingUnlock({ itineraryId, dayId, attractionId, latitude, longitude, accuracy, timestamp: Date.now() });
          wx.showToast({ title: '解锁待确认，恢复网络后自动完成', icon: 'none' });
        }
        this.loadItinerary();
      }
    } catch (locErr: any) {
      if (locErr.errMsg && locErr.errMsg.includes('deny')) {
        wx.showModal({
          title: '需要定位权限',
          content: '请授权定位以验证您已到达景点',
          confirmText: '去设置',
          success: (res) => { if (res.confirm) wx.openSetting(); },
        });
      } else {
        wx.showToast({ title: '定位失败，请开启定位服务', icon: 'none' });
      }
    } finally {
      this.setData({ unlockingAttractionId: null });
    }
  },

  async onAttractionSkip(e: any) {
    const { attractionId } = e.detail;
    const { itineraryId, currentDayData } = this.data;
    const dayId = (currentDayData as any)?.itineraryDayId;
    if (!dayId || !attractionId) return;

    wx.showModal({
      title: '确认跳过',
      content: '跳过后无法再解锁此景点，确认？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await skipAttraction(itineraryId, dayId, attractionId);
          wx.showToast({ title: '已跳过', icon: 'success' });
          this.loadItinerary();
        } catch (err: any) {
          wx.showToast({ title: err.message || '操作失败', icon: 'none' });
        }
      },
    });
  },

  async onAttractionForceUnlock(e: any) {
    const { attractionId } = e.detail;
    const { itineraryId, currentDayData } = this.data;
    const dayId = (currentDayData as any)?.itineraryDayId;
    if (!dayId || !attractionId) return;

    try {
      await forceUnlockAttraction(itineraryId, dayId, attractionId);
      wx.showToast({ title: '强制解锁成功', icon: 'success' });
      this.loadItinerary();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  onAttractionNavigate(e: any) {
    const { latitude, longitude, name } = e.detail;
    if (!latitude || !longitude) {
      wx.showToast({ title: '坐标不可用', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '前往神秘地点',
      content: '导航仅带你到达大致区域。到达后请返回小程序点击「我已到达」解锁真实坐标。',
      confirmText: '开始导航',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return;
        wx.openLocation({
          latitude,
          longitude,
          name: name || '神秘地点',
          scale: 15,
        });
      },
    });
  },

  onShareAppMessage() {
    const { itinerary, itineraryId, showIntroDrawer, introData } = this.data;

    if (showIntroDrawer === 'dining') {
      return {
        title: getDiningShareTitle(introData),
        path: `/pages/itinerary-detail/index?id=${itineraryId}`,
      };
    }

    return {
      title: itinerary?.itineraryName || '我的旅行行程',
      path: `/pages/itinerary-detail/index?id=${itineraryId}`,
    };
  },
});
