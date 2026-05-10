export interface TravelAccommodation {
  accommodationId?: number;
  accommodationName?: string;
  accommodationDesc?: string;
  contactPhone?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  accommodationType?: string;
  breakfastIncluded?: string;
  petFriendly?: string;
  priceMin?: number;
  priceMax?: number;
  status?: string;
  delFlag?: string;
  attachments?: Record<string, any>[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export interface AccommodationListParams {
  keyword?: string;
}
