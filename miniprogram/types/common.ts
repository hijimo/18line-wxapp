export interface AjaxResult<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface TableDataInfo<T = any> {
  code: number;
  msg: string;
  rows: T[];
  total: number;
}

export interface PageParams {
  pageNum?: number;
  pageSize?: number;
}
