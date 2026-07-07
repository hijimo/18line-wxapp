export interface TravelCheckin {
  checkinId?: number;
  attractionId?: number;
  checkinName?: string;
  checkinShortName?: string;
  checkinDescription?: string;
  checkinBlurb?: string;
  province?: string;
  city?: string;
  district?: string;
  longitude?: number;
  latitude?: number;
  checkinNotes?: string;
  blindStatus?: string;
  classicRating?: string;
  leisureRating?: string;
  visitDuration?: string;
  openTime?: string;
  ticketPriceA?: number;
  ticketPriceC?: number;
  perCost?: string;
  sortOrder?: number;
  status?: string;
  delFlag?: string;
  attachments?: Record<string, any>[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export interface CheckinListParams {
  keyword?: string;
  province?: string;
  city?: string;
  district?: string;
  blindStatus?: string;
  minClassicRating?: number;
  pageNum?: number;
  pageSize?: number;
}
