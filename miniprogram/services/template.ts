import request from '../utils/request';
import type { Template } from '../types/template';
import type { AjaxResult } from '../types/common';

export const getTemplateList = () =>
  request<AjaxResult<Template[]>>('/wx/template/list');
