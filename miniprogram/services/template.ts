import request from '../utils/request';
import type { Template, TravelTemplate } from '../types/template';
import type { AjaxResult } from '../types/common';

export const getTemplateList = () =>
  request<AjaxResult<Template[]>>('/wx/template/list');

export const getTemplateDetail = (templateId: number) =>
  request<AjaxResult<TravelTemplate>>(`/wx/template/${templateId}`);
