import request from '../utils/request';
import type { TravelLocalSpecialtyDish, LocalSpecialtyListParams } from '../types/local-specialty';
import type { AjaxResult } from '../types/common';

/** 按省市区查询地方特色菜列表 */
export const getLocalSpecialtyList = (params?: LocalSpecialtyListParams) =>
  request<AjaxResult<TravelLocalSpecialtyDish[]>>('/wx/localSpecialty/list', { data: params });

/** 获取地方特色菜详情 */
export const getLocalSpecialtyDetail = (specialtyId: number) =>
  request<AjaxResult<TravelLocalSpecialtyDish>>(`/wx/localSpecialty/${specialtyId}`);
