import request from '../utils/request';
import type { Template, TravelTemplate } from '../types/template';
import type { AjaxResult } from '../types/common';

export interface TemplateListParams {
  keyword?: string;
}

export const getTemplateList = (params?: TemplateListParams) =>
  request<AjaxResult<Template[]>>('/wx/template/list', { data: params });

export const getTemplateDetail = (templateId: number) =>
  request<AjaxResult<TravelTemplate>>(`/wx/template/${templateId}`);
