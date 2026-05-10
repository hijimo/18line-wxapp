export interface TravelAttraction {
  attractionId?: number;
  attractionName?: string;
  attractionShortName?: string;
  attractionDescription?: string;
  attractionBlurb?: string;
  province?: string;
  city?: string;
  district?: string;
  longitude?: number;
  latitude?: number;
  attractionNotes?: string;
  blindStatus?: string;
  classicRating?: string;
  leisureRating?: string;
  visitDuration?: string;
  openTime?: string;
  familyFriendly?: string;
  ticketPriceA?: number;
  ticketPriceC?: number;
  reservationRequired?: string;
  perCost?: string;
  indoorOutdoor?: string;
  closedDay?: string;
  specialPeriod?: string;
  badFactors?: string;
  attractionType?: string;
  status?: string;
  delFlag?: string;
  attachments?: Record<string, any>[];
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export interface AttractionListParams {
  keyword?: string;
}
