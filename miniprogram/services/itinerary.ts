import request from '../utils/request';
import type {
  Itinerary,
  ItineraryParams,
  ItineraryListParams,
  UpdateDayDiningParams,
  UpdateDayAttractionsParams,
  UpdateDayAccommodationParams,
} from '../types/itinerary';
import type { AjaxResult } from '../types/common';

/** 查询行程列表 */
export const getItineraryList = (params?: ItineraryListParams) =>
  request<AjaxResult<Itinerary[]>>('/wx/itinerary/list', { data: params });

/** 查询行程详情 */
export const getItinerary = (itineraryId: number) =>
  request<AjaxResult<Itinerary>>(`/wx/itinerary/${itineraryId}`);

/** 一键生成行程 */
export const autoGenerateItinerary = (params: ItineraryParams) =>
  request<AjaxResult<Itinerary>>('/wx/itinerary/auto', {
    method: 'POST',
    data: params,
  });

/** 手动创建行程 */
export const addItinerary = (params: ItineraryParams) =>
  request<AjaxResult<Itinerary>>('/wx/itinerary/add', {
    method: 'POST',
    data: params,
  });

/** 修改行程 */
export const editItinerary = (params: ItineraryParams) =>
  request<AjaxResult>('/wx/itinerary/edit', { method: 'POST', data: params });

/** 复制行程 */
export const copyItinerary = (params: ItineraryParams) =>
  request<AjaxResult<Itinerary>>('/wx/itinerary/copy', {
    method: 'POST',
    data: params,
  });

/** 确认行程 */
export const confirmItinerary = (params: ItineraryParams) =>
  request<AjaxResult>('/wx/itinerary/confirm', {
    method: 'POST',
    data: params,
  });

/** 更新确认状态 */
export const updateConfirmStatus = (params: ItineraryParams) =>
  request<AjaxResult>('/wx/itinerary/confirmStatus', {
    method: 'POST',
    data: params,
  });

/** 删除行程 */
export const removeItinerary = (params: ItineraryParams) =>
  request<AjaxResult>('/wx/itinerary/remove', { method: 'POST', data: params });

/** 更新日程餐饮 */
export const updateDayDining = (params: UpdateDayDiningParams) => {
  const { itineraryId, dayNumber, ...rest } = params;
  return request<AjaxResult>(
    `/wx/itinerary/${itineraryId}/day/${dayNumber}/dining`,
    { method: 'POST', data: rest },
  );
};

/** 更新日程景点 */
export const updateDayAttractions = (params: UpdateDayAttractionsParams) => {
  const { itineraryId, dayNumber, attractionIds } = params;
  return request<AjaxResult>(
    `/wx/itinerary/${itineraryId}/day/${dayNumber}/attractions`,
    { method: 'POST', data: attractionIds },
  );
};

/** 更新日程住宿 */
export const updateDayAccommodation = (params: UpdateDayAccommodationParams) => {
  const { itineraryId, dayNumber, accommodationId } = params;
  return request<AjaxResult>(
    `/wx/itinerary/${itineraryId}/day/${dayNumber}/accommodation`,
    { method: 'POST', data: accommodationId },
  );
};

/** 添加行程跟拍 */
export const addPhotography = (itineraryId: number, photographyId: number) =>
  request<AjaxResult>(
    `/wx/itinerary/${itineraryId}/photography/add`,
    { method: 'POST', data: photographyId },
  );

/** 添加行程包车 */
export const addCar = (itineraryId: number, carId: number) =>
  request<AjaxResult>(`/wx/itinerary/${itineraryId}/car/add`, {
    method: 'POST',
    data: carId,
  });
