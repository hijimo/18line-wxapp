import request from '../utils/request';
import type { TravelAccommodation, AccommodationListParams } from '../types/accommodation';
import type { AjaxResult } from '../types/common';

/** 查询住宿列表 */
export const getAccommodationList = (params?: AccommodationListParams) =>
  request<AjaxResult<TravelAccommodation[]>>('/wx/accommodation/list', { data: params });

/** 查询住宿详情（含经纬度和图片） */
export const getAccommodationDetail = (accommodationId: number) =>
  request<AjaxResult<TravelAccommodation>>(`/wx/accommodation/${accommodationId}`);
