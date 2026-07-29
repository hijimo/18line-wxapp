export interface TravelDining {
  diningId?: number;
  diningName?: string;
  diningDesc?: string;
  diningTips?: string;
  /** 营业开始时间(HH:mm) */
  openTime?: string;
  /** 营业结束时间(HH:mm) */
  closeTime?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  petFriendly?: string;
  /** 性质(0早餐 1正餐 2宵夜 3其他) */
  diningNature?: string;
  /** 类别(0大众常规 1地方特色) */
  diningCategory?: string;
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
  province?: string;
  city?: string;
  district?: string;
  pageNum?: number;
  pageSize?: number;
}
