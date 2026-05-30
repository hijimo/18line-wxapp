import request from '../utils/request';
import type { TravelPhotography } from '../types/itinerary';
import type { AjaxResult, TableDataInfo } from '../types/common';

export interface PhotographyListParams {
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}

/** 查询跟拍列表 */
export const getPhotographyList = (params?: PhotographyListParams) =>
  request<TableDataInfo<TravelPhotography>>('/wx/photography/list', { data: params });

/** 查询跟拍详情 */
export const getPhotographyDetail = (photographyId: number) =>
  request<AjaxResult<TravelPhotography>>(`/wx/photography/${photographyId}`);
