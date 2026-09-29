import request from '../utils/request';
import type { TravelLineVO, LineListParams } from '../types/line';
import type { AjaxResult, TableDataInfo } from '../types/common';

/**
 * 查询线路列表（分页）。
 * 后端已强制 status='0'，停用线路查不出来。
 * 注意：列表**不含** attractions / attractionCount。
 */
export const getLineList = (params?: LineListParams) =>
  request<TableDataInfo<TravelLineVO>>('/wx/line/list', { data: params });

/** 查询线路详情（含可见景点明细，已剔除全盲惊喜景点） */
export const getLineDetail = (lineId: number) =>
  request<AjaxResult<TravelLineVO>>(`/wx/line/${lineId}`);
