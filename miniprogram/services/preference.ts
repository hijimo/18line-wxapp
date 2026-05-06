import request from '../utils/request';
import type { Preference, PreferenceParams } from '../types/preference';
import type { AjaxResult } from '../types/common';

/** 查询游客喜好 */
export const getPreference = () =>
  request<AjaxResult<Preference>>('/wx/preference');

/** 获取游客最近一次喜好配置 */
export const getLatestPreference = () =>
  request<AjaxResult<Preference>>('/wx/preference/latest');

/** 新增游客喜好 */
export const addPreference = (params: PreferenceParams) =>
  request<AjaxResult>('/wx/preference', { method: 'POST', data: params });

/** 更新游客喜好 */
export const updatePreference = (params: PreferenceParams) =>
  request<AjaxResult>('/wx/preference', { method: 'PUT', data: params });
