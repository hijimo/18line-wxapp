import request from '../utils/request';
import type { AjaxResult } from '../types/common';

export interface WeatherDay {
  date: string;
  tempMax: string;
  tempMin: string;
  textDay: string;
  textNight: string;
  iconDay: string;
  iconNight: string;
  windDirDay: string;
  windScaleDay: string;
  humidity: string;
  uvIndex: string;
}

export interface WeatherForecastParams {
  city: string;
  days?: number;
}

/** 查询天气预报 */
export const getWeatherForecast = (params: WeatherForecastParams) =>
  request<AjaxResult<WeatherDay[]>>('/wx/weather/forecast', { data: params });
