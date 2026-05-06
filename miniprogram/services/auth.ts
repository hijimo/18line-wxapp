import request from '../utils/request';
import type { Tourist, LoginParams, BindPhoneParams, LoginResult } from '../types/auth';
import type { AjaxResult } from '../types/common';

/** 微信登录 */
export const login = (params: LoginParams) =>
  request<AjaxResult<LoginResult>>('/wx/auth/login', {
    method: 'POST',
    data: params,
  });

/** 绑定手机号 */
export const bindPhone = (params: BindPhoneParams) =>
  request<AjaxResult>('/wx/auth/bindPhone', { method: 'POST', data: params });

/** 获取游客信息 */
export const getUserInfo = () =>
  request<AjaxResult<Tourist>>('/wx/auth/getUserInfo');

/** 更新游客资料 */
export const updateProfile = (params: Partial<Tourist>) =>
  request<AjaxResult>('/wx/auth/updateProfile', {
    method: 'PUT',
    data: params,
  });
