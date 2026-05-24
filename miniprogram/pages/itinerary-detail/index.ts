import {
  getItinerary,
  getItineraryList,
  autoGenerateItinerary,
  editItinerary,
} from '../../services/itinerary';
import { getTemplateDetail } from '../../services/template';
import { getLocalSpecialtyList } from '../../services/local-specialty';
import { getMultiStopRoute } from '../../services/map';
import type { Itinerary, TravelItineraryDay } from '../../types/itinerary';
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

function normalizeItineraryDisplay(itinerary: Itinerary): Itinerary {
  return {
    ...itinerary,
    dateRangeText: formatDateRange(itinerary.startDate, itinerary.days),
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

function buildDiningIntroData(
  data: Record<string, unknown>,
  meal: DiningIntroMeal | undefined,
  dayData: TravelItineraryDay | null,
) {
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
    title: typeof data.diningName === 'string' ? data.diningName : '餐饮安排',
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
    ...data,
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
    mapMarkers: [] as any[],
    mapPolyline: [] as any[],
    mapCenter: { latitude: 28.45, longitude: 119.92 },
    mapScale: 12,
    drawerHeight: DEFAULT_DRAWER_HEIGHT,
    drawerHeightLevel: DEFAULT_DRAWER_HEIGHT,
    drawerDragging: false,
    showDatePicker: false,
    datePickerEndDate: '',
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

      const normalizedItinerary = normalizeItineraryDisplay(itinerary);
      const daysList = normalizedItinerary.daysList || [];
      const currentDayData =
        daysList.find((d) => d.dayNumber === currentDay) || daysList[0] || null;

      this.setData({
        itinerary: normalizedItinerary,
        currentDayData,
        currentDay: currentDayData?.dayNumber || 1,
        loading: false,
      });

      this.updateMapData(currentDayData);

      this.loadLocalSpecialty(
        normalizedItinerary.province,
        normalizedItinerary.city,
        normalizedItinerary.district,
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
    this.setData({
      showIntroDrawer: type,
      introData:
        type === 'dining'
          ? buildDiningIntroData(data || {}, meal, currentDayData)
          : data,
    });
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

  onDrawerTouchStart(e: any) {
    if (drawerTouchActive) return;

    const dragScope = e.currentTarget?.dataset?.dragScope;
    const canDrag = this.data.drawerHeightLevel === 20 || dragScope === 'handle';

    if (!canDrag) return;

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
      this.setData({ mapMarkers: [], mapPolyline: [] });
      return;
    }

    const attractions = dayData.attractionList.filter(
      (a) => a.latitude && a.longitude,
    );

    if (attractions.length === 0) {
      this.setData({ mapMarkers: [], mapPolyline: [] });
      return;
    }

    const markers = attractions.map((a, idx) => ({
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

    let mapScale = 12;
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

    const mapCenter = {
      latitude:
        routeCenter.latitude -
        getLatitudeOffsetForMapFocus(routeCenter.latitude, mapScale),
      longitude: routeCenter.longitude,
    };

    this.setData({ mapMarkers: markers, mapPolyline: [], mapCenter, mapScale });

    if (attractions.length >= 2) {
      const stops = attractions.map((a) => ({
        latitude: a.latitude!,
        longitude: a.longitude!,
      }));
      try {
        const routePoints = await getMultiStopRoute(stops);
        this.setData({
          mapPolyline: [{
            points: routePoints,
            color: '#163422',
            width: 6,
            arrowLine: true,
          }],
        });
      } catch (err) {
        console.error('[Map] getMultiStopRoute error:', err);
        this.setData({
          mapPolyline: [{
            points: stops,
            color: '#163422',
            width: 6,
            arrowLine: true,
          }],
        });
      }
    } else {
      this.setData({ mapPolyline: [] });
    }
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
