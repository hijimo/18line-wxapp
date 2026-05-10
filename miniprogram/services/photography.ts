import request from '../utils/request';
import type { TravelPhotography } from '../types/itinerary';
import type { AjaxResult } from '../types/common';

/** 查询跟拍列表 */
export const getPhotographyList = (params?: { keyword?: string }) =>
  request<AjaxResult<TravelPhotography[]>>('/wx/photography/list', { data: params });

/** 查询跟拍详情 */
export const getPhotographyDetail = (photographyId: number) =>
  request<AjaxResult<TravelPhotography>>(`/wx/photography/${photographyId}`);
