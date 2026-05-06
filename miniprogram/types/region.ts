export interface Region {
  code: string;
  name: string;
  parentCode?: string;
  level?: number;
  children?: Region[];
}
