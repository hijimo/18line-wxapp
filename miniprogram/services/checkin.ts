import request from '../utils/request';
import type { TravelCheckin, CheckinListParams } from '../types/checkin';
import type { AjaxResult, TableDataInfo } from '../types/common';

/** 查询打卡点列表 */
export const getCheckinList = (params?: CheckinListParams) =>
  request<TableDataInfo<TravelCheckin>>('/wx/checkin/list', { data: params });

/** 查询打卡点详情（含图片） */
export const getCheckinDetail = (checkinId: number) =>
  request<AjaxResult<TravelCheckin>>(`/wx/checkin/${checkinId}`);
