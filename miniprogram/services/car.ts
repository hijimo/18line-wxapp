import request from '../utils/request';
import type { TravelCar, CarListParams } from '../types/car';
import type { AjaxResult } from '../types/common';

/** 查询包车列表 */
export const getCarList = (params?: CarListParams) =>
  request<AjaxResult<TravelCar[]>>('/wx/car/list', { data: params });

/** 查询包车详情（含图片） */
export const getCarDetail = (carId: number) =>
  request<AjaxResult<TravelCar>>(`/wx/car/${carId}`);
