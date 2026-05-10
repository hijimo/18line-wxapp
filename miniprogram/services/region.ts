import request from '../utils/request';
import type { Region } from '../types/region';
import type { AjaxResult } from '../types/common';

/** 获取所有省级数据 */
export const getProvinces = () =>
  request<AjaxResult<Region[]>>('/wx/region/province');

/** 根据省份编码获取市级数据 */
export const getCities = (provinceCode: string) =>
  request<AjaxResult<Region[]>>(`/wx/region/city/${provinceCode}`);

/** 根据城市编码获取区级数据 */
export const getDistricts = (cityCode: string) =>
  request<AjaxResult<Region[]>>(`/wx/region/district/${cityCode}`);

/** 获取树形区域数据（分级加载） */
export const getRegionTree = async (): Promise<AjaxResult<Region[]>> => {
  const provincesRes = await getProvinces();
  const provinces = provincesRes.data || [];

  const tree: Region[] = await Promise.all(
    provinces.map(async (province) => {
      const citiesRes = await getCities(province.code);
      const cities = citiesRes.data || [];

      const citiesWithDistricts: Region[] = await Promise.all(
        cities.map(async (city) => {
          const districtsRes = await getDistricts(city.code);
          return { ...city, children: districtsRes.data || [] };
        }),
      );

      return { ...province, children: citiesWithDistricts };
    }),
  );

  return { code: 200, msg: 'success', data: tree } as AjaxResult<Region[]>;
};
