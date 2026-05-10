import request from '../utils/request';
import type { TravelDining, DiningListParams } from '../types/dining';
import type { AjaxResult } from '../types/common';

/** 查询餐饮列表 */
export const getDiningList = (params?: DiningListParams) =>
  request<AjaxResult<TravelDining[]>>('/wx/dining/list', { data: params });

/** 查询餐饮详情（含图片） */
export const getDiningDetail = (diningId: number) =>
  request<AjaxResult<TravelDining>>(`/wx/dining/${diningId}`);
