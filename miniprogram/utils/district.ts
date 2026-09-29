/**
 * 「当地」地区共享模块：首页地址切换器、创建行程页、集市页共用的唯一数据源。
 *
 * 地区列表当前写死（编码与后端 sys_region 表一致）：
 * 松阳县、缙云县为丽水市下辖县域，杭州市为市级选项。
 * 用户手动选择的「当地」持久化在 storage `home_district`。
 *
 * 县域选项按 district 精确查询；市级选项（level='city'）不带 district，
 * 由后端按 city 过滤，避免把市编码当成区编码查询导致空列表。
 */

/** 选项层级：city=市级（按 city 查询），district=区县级（按 district 查询） */
export type DistrictLevel = 'city' | 'district';

export interface DistrictOption {
  /** 选项编码：县域为 district 编码，市级为 city 编码 */
  code: string;
  name: string;
  /** 层级，缺省按县域处理 */
  level?: DistrictLevel;
  /** 所属省编码，缺省为浙江省 */
  provinceCode?: string;
  /** 所属省名称，缺省为浙江省 */
  provinceName?: string;
  /** 所属市编码，缺省为丽水市；市级选项以 code 为准 */
  cityCode?: string;
  /** 所属市名称，缺省为丽水市；市级选项以 name 为准 */
  cityName?: string;
}

/** 后端列表/生成接口使用的地区查询参数 */
export interface RegionQuery {
  province: string;
  city: string;
  /** 市级选项不下发 district */
  district?: string;
}

/** 可切换的「当地」列表（写死；默认松阳县） */
export const DISTRICT_OPTIONS: DistrictOption[] = [
  { code: '331124', name: '松阳县' },
  { code: '331122', name: '缙云县' },
  { code: '330100', name: '杭州市', level: 'city' },
];

export const DEFAULT_DISTRICT = '331124';
export const DEFAULT_DISTRICT_NAME = '松阳县';
/** 默认「当地」选项（松阳县），避免各处再拼字面量丢失 level 等信息 */
export const DEFAULT_DISTRICT_OPTION: DistrictOption = DISTRICT_OPTIONS[0];

/** 缺省省市（县域选项未显式声明时使用） */
export const FIXED_PROVINCE_CODE = '330000';
export const FIXED_PROVINCE_NAME = '浙江省';
export const FIXED_CITY_CODE = '331100';
export const FIXED_CITY_NAME = '丽水市';

/** 「当地」手动选择的持久化 storage key */
export const DISTRICT_STORAGE_KEY = 'home_district';

/** 按编码查找地址选项；不在可切换列表内返回 null */
export function findDistrictOption(code?: string | null): DistrictOption | null {
  if (!code) return null;
  return DISTRICT_OPTIONS.find((o) => o.code === code) || null;
}

function isCityLevel(option: DistrictOption): boolean {
  return option.level === 'city';
}

/** 选项对应的省编码 */
export function getOptionProvinceCode(option: DistrictOption): string {
  return option.provinceCode || FIXED_PROVINCE_CODE;
}

/** 选项对应的省名称 */
export function getOptionProvinceName(option: DistrictOption): string {
  return option.provinceName || FIXED_PROVINCE_NAME;
}

/** 选项对应的市编码：市级选项即自身编码 */
export function getOptionCityCode(option: DistrictOption): string {
  return isCityLevel(option) ? option.code : option.cityCode || FIXED_CITY_CODE;
}

/** 选项对应的市名称 */
export function getOptionCityName(option: DistrictOption): string {
  return isCityLevel(option)
    ? option.cityName || option.name
    : option.cityName || FIXED_CITY_NAME;
}

/** 选项对应的区县编码：市级选项没有区县，返回空串 */
export function getOptionDistrictCode(option: DistrictOption): string {
  return isCityLevel(option) ? '' : option.code;
}

/** 选项对应的区县名称：市级选项返回空串，避免展示「浙江省 杭州市 杭州市」 */
export function getOptionDistrictName(option: DistrictOption): string {
  return isCityLevel(option) ? '' : option.name;
}

/** 把选项转成后端地区查询参数 */
export function buildRegionQuery(option: DistrictOption): RegionQuery {
  const query: RegionQuery = {
    province: getOptionProvinceCode(option),
    city: getOptionCityCode(option),
  };
  const district = getOptionDistrictCode(option);
  if (district) query.district = district;
  return query;
}

/** 按编码转成后端地区查询参数；编码不在列表内时回退默认松阳县 */
export function buildRegionQueryByCode(code?: string | null): RegionQuery {
  return buildRegionQuery(findDistrictOption(code) || DEFAULT_DISTRICT_OPTION);
}

/** 读取用户上次手动选择的「当地」；无记录或不在列表内返回 null */
export function getStoredDistrictOption(): DistrictOption | null {
  try {
    const code = wx.getStorageSync(DISTRICT_STORAGE_KEY);
    return findDistrictOption(typeof code === 'string' ? code : '');
  } catch {
    return null;
  }
}

/** 当前生效的「当地」：手动选择优先，否则默认松阳县 */
export function getSelectedDistrict(): DistrictOption {
  return getStoredDistrictOption() || DEFAULT_DISTRICT_OPTION;
}

/** 持久化手动选择的「当地」；列表外编码不写入 */
export function setSelectedDistrict(code: string): void {
  if (!findDistrictOption(code)) return;
  try {
    wx.setStorageSync(DISTRICT_STORAGE_KEY, code);
  } catch {
    // ignore storage failures
  }
}
