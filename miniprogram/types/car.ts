export interface TravelCar {
  carId?: number;
  nickname?: string;
  gender?: string;
  introduction?: string;
  contactInfo?: string;
  price?: number;
  carModel?: string;
  seatCount?: number;
  drivingYears?: number;
  status?: string;
  delFlag?: string;
  attachments?: Record<string, any>[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export interface CarListParams {
  keyword?: string;
}
