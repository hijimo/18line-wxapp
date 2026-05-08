import request from '../utils/request';
import type { DictData, DictType, DictBatchResult } from '../types/dict';
import type { AjaxResult } from '../types/common';

/** 根据字典类型查询字典数据 */
export const getDictByType = (dictType: string) =>
  request<AjaxResult<DictData[]>>(`/wx/dict/${dictType}`);

/** 获取字典类型列表 */
export const getDictTypes = () =>
  request<AjaxResult<DictType[]>>('/wx/dict/types');

/** 批量查询多个字典类型 */
export const getDictBatch = (dictTypes: string[]) =>
  request<AjaxResult<DictBatchResult>>('/wx/dict/batch', {
    method: 'POST',
    data: dictTypes,
  });
