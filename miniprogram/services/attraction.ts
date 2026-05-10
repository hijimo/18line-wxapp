import request from '../utils/request';
import type { TravelAttraction, AttractionListParams } from '../types/attraction';
import type { AjaxResult } from '../types/common';

/** 查询景点列表 */
export const getAttractionList = (params?: AttractionListParams) =>
  request<AjaxResult<TravelAttraction[]>>('/wx/attraction/list', { data: params });

/** 查询景点详情（含图片） */
export const getAttractionDetail = (attractionId: number) =>
  request<AjaxResult<TravelAttraction>>(`/wx/attraction/${attractionId}`);
