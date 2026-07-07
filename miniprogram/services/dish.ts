import request from '../utils/request';
import type { TravelDish, HomeFeaturedDish, FeaturedDishParams } from '../types/dish';
import type { AjaxResult } from '../types/common';

/** 首页地道风物：按地区查询各餐厅特色菜（每餐厅≤3，共9） */
export const getFeaturedDishes = (params?: FeaturedDishParams) =>
  request<AjaxResult<HomeFeaturedDish[]>>('/wx/dish/featured', { data: params });

/** 按餐厅ID查询菜品列表 */
export const getDishesByDining = (diningId: number) =>
  request<AjaxResult<TravelDish[]>>('/wx/dish/list', { data: { diningId } });
