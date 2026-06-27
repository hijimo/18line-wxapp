import type { TravelDining } from './dining';
import type { TravelAccommodation } from './accommodation';
import type { TravelAttraction } from './attraction';
import type { TravelCar } from './car';

export interface TravelPhotography {
  photographyId?: number;
  nickname?: string;
  gender?: string;
  introduction?: string;
  contactInfo?: string;
  price?: number;
  recommendRating?: number;
  equipment?: string;
  status?: string;
  delFlag?: string;
  attachments?: Record<string, any>[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export type BlindDisplayMode = 'locked' | 'next' | 'unlocked' | 'visible' | 'skipped';

export interface BlindAttractionInfo {
  attractionId: number;
  sortOrder: number;
  blindDisplayMode: BlindDisplayMode;
  fuzzyLongitude?: number;
  fuzzyLatitude?: number;
  fuzzyRadius?: number;
  categoryHint?: string;
  durationHint?: string;
  prepHint?: string;
  budgetTier?: string;
  forceUnlockAvailableAt?: string;
  attractionName?: string;
  attractionDescription?: string;
  longitude?: number;
  latitude?: number;
  attachments?: Record<string, any>[];
  visitDuration?: string;
  attractionNotes?: string;
  unlockTime?: string;
}

export interface TravelItineraryDay {
  itineraryDayId?: number;
  itineraryId?: number;
  templateDayId?: number;
  dayNumber?: number;
  dayTheme?: string;
  attractionIds?: string;
  attractionCriteria?: string;
  touristAttractionIds?: string;
  accommodationId?: number;
  touristAccommodationId?: number;
  breakfastId?: number;
  touristBreakfastId?: number;
  lunchId?: number;
  touristLunchId?: number;
  dinnerId?: number;
  touristDinnerId?: number;
  photographyId?: number;
  touristPhotographyId?: number;
  carId?: number;
  touristCarId?: number;
  accommodation?: TravelAccommodation;
  touristAccommodation?: TravelAccommodation;
  attractionList?: TravelAttraction[];
  touristAttractionList?: TravelAttraction[];
  breakfast?: TravelDining;
  touristBreakfast?: TravelDining;
  lunch?: TravelDining;
  touristLunch?: TravelDining;
  dinner?: TravelDining;
  touristDinner?: TravelDining;
  photography?: TravelPhotography;
  touristPhotography?: TravelPhotography;
  car?: TravelCar;
  touristCar?: TravelCar;
  blindAttractions?: BlindAttractionInfo[];
  delFlag?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export interface Itinerary {
  itineraryId?: number;
  touristId?: number;
  templateId?: number;
  templateDayIds?: string;
  itineraryName?: string;
  province?: string;
  city?: string;
  district?: string;
  provinceName?: string;
  cityName?: string;
  districtName?: string;
  startDate?: string;
  endDate?: string;
  dateRangeText?: string;
  days?: number;
  status?: string;
  statusLabel?: string;
  createFrom?: string;
  createFromLabel?: string;
  version?: number;
  totalCost?: number;
  blindMode?: string;
  remark?: string;
  delFlag?: string;
  daysList?: TravelItineraryDay[];
  attachments?: Record<string, any>[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

export type ItineraryParams = Partial<Itinerary>;

export interface ItineraryListParams {
  status?: string;
}

export interface UpdateDayDiningParams {
  itineraryId: number;
  dayNumber: number;
  breakfastId?: number | null;
  lunchId?: number | null;
  dinnerId?: number | null;
}

export interface UpdateDayAttractionsParams {
  itineraryId: number;
  dayNumber: number;
  attractionIds: string;
}

export interface UpdateDayAccommodationParams {
  itineraryId: number;
  dayNumber: number;
  accommodationId: number | null;
}

export interface AddItineraryCarParams {
  itineraryId: number;
  dayNumber: number;
  carId: number;
}

export interface AddItineraryPhotographyParams {
  itineraryId: number;
  dayNumber: number;
  photographyId: number;
}
