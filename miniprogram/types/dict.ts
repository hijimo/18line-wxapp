export interface DictType {
  dictId?: number;
  dictName: string;
  dictType: string;
  status?: string;
  remark?: string;
  createTime?: string;
}

export interface DictData {
  dictCode?: number;
  dictSort?: number;
  dictLabel: string;
  dictValue: string;
  dictType: string;
  cssClass?: string;
  listClass?: string;
  isDefault?: string;
  status?: string;
  remark?: string;
  createTime?: string;
}

export interface DictBatchResult {
  [dictType: string]: DictData[];
}
