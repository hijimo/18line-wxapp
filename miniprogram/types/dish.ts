export interface TravelDish {
  dishId?: number;
  diningId?: number;
  dishName?: string;
  dishDesc?: string;
  specialStar?: number;
  darkLevel?: string;
  price?: number;
  seasonal?: string;
  reservation?: string;
  status?: string;
  delFlag?: string;
  attachments?: Record<string, any>[];
}

/** 首页「地道风物」特色菜展示项 */
export interface HomeFeaturedDish {
  dishId?: number;
  diningId?: number;
  diningName?: string;
  dishName?: string;
  image?: string;
  specialStar?: number;
}

export interface FeaturedDishParams {
  province?: string;
  city?: string;
  district?: string;
}
