export interface TravelItineraryDay {
  dayId?: number;
  itineraryId?: number;
  dayNumber?: number;
  breakfastId?: number;
  lunchId?: number;
  dinnerId?: number;
  accommodationId?: number;
  attractionIds?: string;
  [key: string]: any;
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
  startDate?: string;
  days?: number;
  status?: string;
  statusLabel?: string;
  createFrom?: string;
  createFromLabel?: string;
  version?: number;
  totalCost?: number;
  remark?: string;
  delFlag?: string;
  daysList?: TravelItineraryDay[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

export type ItineraryParams = Omit<Itinerary, 'itineraryId'> & {
  itineraryId?: number;
};

export interface UpdateDayDiningParams {
  itineraryId: number;
  dayNumber: number;
  breakfastId?: number;
  lunchId?: number;
  dinnerId?: number;
}

export interface UpdateDayAttractionsParams {
  itineraryId: number;
  dayNumber: number;
  attractionIds: string;
}

export interface UpdateDayAccommodationParams {
  itineraryId: number;
  dayNumber: number;
  accommodationId: number;
}
