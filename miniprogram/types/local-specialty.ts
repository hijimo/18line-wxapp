export interface TravelLocalSpecialtyDish {
  specialtyId?: number;
  specialtyName?: string;
  specialtyDesc?: string;
  province?: string;
  city?: string;
  district?: string;
  specialStar?: number;
  darkLevel?: string;
  price?: number;
  seasonal?: string;
  reservation?: string;
  status?: string;
  delFlag?: string;
  attachments?: Record<string, any>[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export interface LocalSpecialtyListParams {
  province?: string;
  city?: string;
  district?: string;
}
