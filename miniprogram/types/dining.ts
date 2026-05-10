export interface TravelDining {
  diningId?: number;
  diningName?: string;
  diningDesc?: string;
  diningTips?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  petFriendly?: string;
  diningNature?: string;
  avgCost?: number;
  recommendRating?: number;
  parkingAvailable?: string;
  status?: string;
  delFlag?: string;
  attachments?: Record<string, any>[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export interface DiningListParams {
  keyword?: string;
}
