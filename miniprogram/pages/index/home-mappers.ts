import type { Itinerary, TravelItineraryDay } from '../../types/itinerary';
import type { TravelAttraction } from '../../types/attraction';
import type { TravelCheckin } from '../../types/checkin';
import type { HomeFeaturedDish } from '../../types/dish';
import type { Template } from '../../types/template';

/** 默认目的地 district：松阳县 */
export const DEFAULT_DISTRICT = '331124';
export const DEFAULT_DISTRICT_NAME = '松阳县';

/** 默认占位图（OSS） */
export const DEFAULT_HOTEL_IMAGE =
  'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/default-hotel.svg';
export const DEFAULT_DINING_IMAGE =
  'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/default-dining.svg';
export const DEFAULT_DESTINATION_IMAGE =
  'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/default-destination.svg';

/** 盲游脱敏名 */
export const MYSTERY_NAME = '神秘景点';

export interface JourneyDayDot {
  day: number;
  label: string;
  number: string;
  status: 'completed' | 'active' | 'upcoming';
}

export interface DestinationImage {
  image: string;
  blurred: boolean;
}

export interface JourneyCorner {
  name: string;
  image: string;
  isDefault: boolean;
}

export interface JourneyCardVM {
  id: string;
  title: string;
  date: string;
  budget: string;
  district: string;
  districtName: string;
  days: JourneyDayDot[];
  goalTitle: string;
  destinationImages: DestinationImage[];
  hotel: JourneyCorner;
  restaurant: JourneyCorner & { diningId: number | null };
}

export interface InspirationCardVM {
  id: string;
  attractionId: number | null;
  image: string;
  rating: string;
  tag: string;
  tagColor: 'green' | 'brown' | 'dark';
  title: string;
  description: string;
  blurred: boolean;
}

export interface GemItemVM {
  id: string;
  checkinId: number | null;
  title: string;
  price: string;
  description: string;
  duration: string;
  distance: string;
  image: string;
  blurred: boolean;
}

export interface FoodCardVM {
  id: string;
  dishId: number | null;
  diningId: number | null;
  name: string;
  tag: string;
  tagType: 'must-try' | 'seasonal';
  image: string;
}

/* ------------------------- 通用工具 ------------------------- */

export function firstImage(attachments?: Record<string, any>[]): string {
  if (!attachments || attachments.length === 0) return '';
  const url = attachments[0] && (attachments[0].url || attachments[0].fileUrl);
  return typeof url === 'string' ? url : '';
}

export function parseLocalDate(value?: string): Date | null {
  if (!value) return null;
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return null;
  return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
}

function formatMonthDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}.${day}`;
}

export function formatJourneyDateRange(startDate?: string, endDate?: string, days?: number): string {
  const start = parseLocalDate(startDate);
  let end = parseLocalDate(endDate);
  if (!end && start && days && days > 0) {
    end = new Date(start.getTime());
    end.setDate(start.getDate() + days - 1);
  }
  if (!start || !end) return '规划中';
  return `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
}

/** 解析游玩时长为小时数（取前导数字，兼容 "2小时"/"120分钟"/"2.5"） */
export function parseHours(visitDuration?: string): number {
  if (!visitDuration) return 0;
  const m = String(visitDuration).match(/(\d+(\.\d+)?)/);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return 0;
  // 含「分」且无「时/小时」→ 按分钟换算
  if (/分/.test(visitDuration) && !/时/.test(visitDuration)) {
    return num / 60;
  }
  return num;
}

/** 选出「当天」：今天落在 [startDate, startDate+days-1] 的 day，否则第 1 天 */
export function pickCurrentDay(itinerary: Itinerary, today: Date = new Date()): TravelItineraryDay | undefined {
  const daysList = itinerary.daysList || [];
  if (daysList.length === 0) return undefined;
  const start = parseLocalDate(itinerary.startDate);
  if (start) {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.floor((t.getTime() - start.getTime()) / (24 * 3600 * 1000));
    const dayNumber = diffDays + 1;
    if (dayNumber >= 1) {
      const found = daysList.find((d) => d.dayNumber === dayNumber);
      if (found) return found;
    }
  }
  return daysList.find((d) => d.dayNumber === 1) || daysList[0];
}

function isBlindMode(itinerary: Itinerary): boolean {
  // blindMode: '1'=全明; null/'0'/'2' 视为存在盲游
  return itinerary.blindMode !== '1';
}

/** 某景点在当天是否应遮蔽 */
function attractionBlurred(a: TravelAttraction, blind: boolean): boolean {
  if (a.blindStatus === '1') return true;
  // 盲游模式下已被脱敏（名称被后端置空）
  if (blind && !a.attractionName) return true;
  return false;
}

export function buildGoalTitle(day?: TravelItineraryDay): string {
  const attractions = (day && day.attractionList) || [];
  const count = attractions.length;
  if (count === 0) return '';
  const totalHours = attractions.reduce((sum, a) => sum + parseHours(a.visitDuration), 0);
  const rounded = Math.round(totalHours);
  if (rounded > 0) {
    return `当天 ${count} 个景点 · 约 ${rounded} 小时`;
  }
  return `当天 ${count} 个景点`;
}

export function buildDestinationImages(itinerary: Itinerary, day?: TravelItineraryDay): DestinationImage[] {
  const attractions = (day && day.attractionList) || [];
  const blind = isBlindMode(itinerary);
  const images: DestinationImage[] = [];
  for (const a of attractions) {
    const blurred = attractionBlurred(a, blind);
    const img = firstImage(a.attachments);
    images.push({
      image: img || DEFAULT_DESTINATION_IMAGE,
      blurred,
    });
  }
  return images;
}

function buildDays(itinerary: Itinerary, currentDay?: TravelItineraryDay): JourneyDayDot[] {
  const total = itinerary.days || (itinerary.daysList ? itinerary.daysList.length : 0) || 0;
  const activeNum = currentDay ? currentDay.dayNumber || 1 : 1;
  const dots: JourneyDayDot[] = [];
  for (let i = 1; i <= total; i++) {
    let status: JourneyDayDot['status'] = 'upcoming';
    if (i < activeNum) status = 'completed';
    else if (i === activeNum) status = 'active';
    dots.push({ day: i, label: `第${i}天`, number: String(i).padStart(2, '0'), status });
  }
  return dots;
}

function pickRestaurant(day?: TravelItineraryDay) {
  if (!day) return undefined;
  return day.breakfast || day.lunch || day.dinner;
}

export function mapJourney(itinerary: Itinerary, today: Date = new Date()): JourneyCardVM {
  const day = pickCurrentDay(itinerary, today);
  const accommodation = day && day.accommodation;
  const restaurant = pickRestaurant(day);

  const hotelImg = firstImage(accommodation && accommodation.attachments);
  const restImg = firstImage(restaurant && restaurant.attachments);

  return {
    id: String(itinerary.itineraryId || ''),
    title: itinerary.itineraryName || '未命名旅途',
    date: formatJourneyDateRange(itinerary.startDate, itinerary.endDate, itinerary.days),
    budget: itinerary.totalCost ? `¥${itinerary.totalCost}` : '',
    district: itinerary.district || '',
    districtName: itinerary.districtName || '',
    days: buildDays(itinerary, day),
    goalTitle: buildGoalTitle(day),
    destinationImages: buildDestinationImages(itinerary, day),
    hotel: {
      name: (accommodation && accommodation.accommodationName) || '',
      image: hotelImg || DEFAULT_HOTEL_IMAGE,
      isDefault: !hotelImg,
    },
    restaurant: {
      name: (restaurant && restaurant.diningName) || '',
      image: restImg || DEFAULT_DINING_IMAGE,
      isDefault: !restImg,
      diningId: (restaurant && restaurant.diningId) || null,
    },
  };
}

export function mapJourneys(list: Itinerary[], today: Date = new Date()): JourneyCardVM[] {
  return (list || []).map((it) => mapJourney(it, today));
}

/* ------------------------- 三大发现 ------------------------- */

const TAG_COLORS: Array<'green' | 'brown' | 'dark'> = ['green', 'brown', 'dark'];

export function mapSecretAttractions(list: TravelAttraction[]): InspirationCardVM[] {
  return (list || []).map((a, i) => {
    const blurred = a.blindStatus === '1' || !a.attractionName;
    return {
      id: `attraction-${a.attractionId != null ? a.attractionId : i}`,
      attractionId: a.attractionId != null ? a.attractionId : null,
      image: blurred ? DEFAULT_DESTINATION_IMAGE : firstImage(a.attachments) || DEFAULT_DESTINATION_IMAGE,
      rating: a.classicRating || '',
      tag: '经典',
      tagColor: TAG_COLORS[i % TAG_COLORS.length],
      title: blurred ? MYSTERY_NAME : a.attractionName || '',
      description: blurred ? '到达后揭晓的秘境' : a.attractionBlurb || a.attractionDescription || '',
      blurred,
    };
  });
}

export function mapHiddenCheckins(list: TravelCheckin[]): GemItemVM[] {
  return (list || []).map((c, i) => {
    const blurred = c.blindStatus === '1' || !c.checkinName;
    return {
      id: `checkin-${c.checkinId != null ? c.checkinId : i}`,
      checkinId: c.checkinId != null ? c.checkinId : null,
      title: blurred ? MYSTERY_NAME : c.checkinName || '',
      price: c.perCost ? `¥${c.perCost}` : '免费',
      description: blurred ? '到达后揭晓的隐匿之藏' : c.checkinBlurb || c.checkinDescription || '',
      duration: c.visitDuration || '',
      distance: '',
      image: blurred ? DEFAULT_DESTINATION_IMAGE : firstImage(c.attachments) || DEFAULT_DESTINATION_IMAGE,
      blurred,
    };
  });
}

export function mapLocalDishes(list: HomeFeaturedDish[]): FoodCardVM[] {
  return (list || []).map((d, i) => {
    const star = d.specialStar || 0;
    return {
      id: `dish-${d.dishId != null ? d.dishId : i}`,
      dishId: d.dishId != null ? d.dishId : null,
      diningId: d.diningId != null ? d.diningId : null,
      name: d.dishName || '',
      tag: star >= 4 ? '招牌' : '时令',
      tagType: star >= 4 ? 'must-try' : 'seasonal',
      image: d.image || DEFAULT_DINING_IMAGE,
    };
  });
}

/* ------------------------- Banner / 搜索 ------------------------- */

export interface BannerVM {
  id: string;
  image: string;
  tag: string;
  title: string;
  description: string;
  buttonText: string;
  priceLabel: string;
  price: string;
}

export function mapBanners(templates: Template[], limit = 5): BannerVM[] {
  return (templates || []).slice(0, limit).map((t) => ({
    id: String(t.templateId || ''),
    image:
      firstImage((t as any).attachments) ||
      t.coverImage ||
      DEFAULT_DESTINATION_IMAGE,
    tag: t.tag || 'NEW EXPEDITION',
    title: t.templateName || '',
    description: t.description || (t as any).templateDesc || '',
    buttonText: '立即启程',
    priceLabel: 'STARTING FROM',
    price: t.price ? `¥${t.price}` : '',
  }));
}

export interface SearchResultVM {
  id: string;
  templateId: number | null;
  title: string;
  image: string;
  districtName: string;
}

export function mapSearchResults(templates: Template[]): SearchResultVM[] {
  return (templates || []).map((t, i) => ({
    id: `tpl-${t.templateId != null ? t.templateId : i}`,
    templateId: t.templateId != null ? t.templateId : null,
    title: t.templateName || '',
    image: firstImage((t as any).attachments) || t.coverImage || DEFAULT_DESTINATION_IMAGE,
    districtName: t.districtName || '',
  }));
}
