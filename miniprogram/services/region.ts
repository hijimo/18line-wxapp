import request from '../utils/request';
import type { Region } from '../types/region';
import type { AjaxResult } from '../types/common';

/** 获取所有省级数据 */
export const getProvinces = () =>
  request<AjaxResult<Region[]>>('/system/region/province');

/** 根据省份编码获取市级数据 */
export const getCities = (provinceCode: string) =>
  request<AjaxResult<Region[]>>(`/system/region/city/${provinceCode}`);

/** 根据城市编码获取区级数据 */
export const getDistricts = (cityCode: string) =>
  request<AjaxResult<Region[]>>(`/system/region/district/${cityCode}`);

/** 获取树形区域数据 */
export const getRegionTree = () =>
  request<AjaxResult<Region[]>>('/system/region/tree');

/** 刷新省市区缓存 */
export const refreshRegionCache = () =>
  request<AjaxResult>('/system/region/refresh-cache', { method: 'POST' });
