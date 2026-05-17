import type { TravelAttraction } from './attraction';
import type { TravelAccommodation } from './accommodation';
import type { TravelDining } from './dining';
import type { TravelCar } from './car';
import type { TravelPhotography } from './itinerary';

export interface Template {
  templateId?: number;
  templateName?: string;
  coverImage?: string;
  tag?: string;
  description?: string;
  price?: number;
  days?: number;
  province?: string;
  city?: string;
  district?: string;
  provinceName?: string;
  cityName?: string;
  districtName?: string;
}

export interface TravelTemplateDay {
  templateDayId: number;
  templateId: number;
  dayNumber: number;
  dayTheme?: string;
  attractionIds?: string;
  attractionCriteria?: string;
  leisureMin?: number;
  leisureMax?: number;
  accommodationId?: number;
  breakfastDiningId?: number;
  lunchDiningId?: number;
  dinnerDiningId?: number;
  photographyId?: number;
  carId?: number;
  status?: string;
  attractionList?: TravelAttraction[];
  attractions?: TravelAttraction[];
  accommodation?: TravelAccommodation;
  breakfast?: TravelDining;
  lunch?: TravelDining;
  dinner?: TravelDining;
  photography?: TravelPhotography;
  car?: TravelCar;
}

export interface TravelTemplate {
  templateId: number;
  templateName: string;
  templateDesc?: string;
  province?: string;
  city?: string;
  district?: string;
  provinceName?: string;
  cityName?: string;
  districtName?: string;
  baseDays?: number;
  minDays?: number;
  maxDays?: number;
  staminaLevel?: string;
  travelTags?: string;
  includePhotography?: string;
  includeCar?: string;
  version?: number;
  status?: string;
  days?: TravelTemplateDay[];
  attachments?: Record<string, any>[];
}
