export interface AjaxResult<T = any> {
  code: number;
  msg: string;
  data: T;
}
