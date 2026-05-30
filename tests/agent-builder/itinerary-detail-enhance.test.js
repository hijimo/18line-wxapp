/**
 * 行程详情增强功能测试
 * - 景点卡片：休闲程度/经典指数、游玩时间、门票价格、开放时间
 * - 天气信息：每天天气展示
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../miniprogram');

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

describe('[Unit] attraction-card 增强字段展示', () => {
  let wxml, scss;

  beforeAll(() => {
    wxml = readFile('components/attraction-card/attraction-card.wxml');
    scss = readFile('components/attraction-card/attraction-card.scss');
  });

  test('展示休闲程度标签', () => {
    expect(wxml).toContain('item.leisureRating');
    expect(wxml).toContain('休闲');
  });

  test('展示经典指数标签', () => {
    expect(wxml).toContain('item.classicRating');
    expect(wxml).toContain('经典');
  });

  test('标签放在景点名称后面（同一行）', () => {
    expect(wxml).toContain('card-name-row');
    expect(wxml).toContain('card-ratings');
    const nameRowIdx = wxml.indexOf('card-name-row');
    const nameIdx = wxml.indexOf('card-name', nameRowIdx);
    const ratingsIdx = wxml.indexOf('card-ratings', nameRowIdx);
    expect(nameIdx).toBeLessThan(ratingsIdx);
  });

  test('展示游玩时间', () => {
    expect(wxml).toContain('item.visitDuration');
    expect(wxml).toContain('游玩时间');
  });

  test('展示门票价格（条件渲染）', () => {
    expect(wxml).toContain('item.ticketPriceA');
    expect(wxml).toContain('门票');
  });

  test('展示开放时间（条件渲染）', () => {
    expect(wxml).toContain('item.openTime');
    expect(wxml).toContain('开放时间');
  });

  test('游玩时间/门票/开放时间在描述下方', () => {
    const subIdx = wxml.indexOf('card-sub');
    const metaIdx = wxml.indexOf('card-meta');
    expect(metaIdx).toBeGreaterThan(subIdx);
  });

  test('SCSS 包含评分标签样式', () => {
    expect(scss).toContain('card-rating-tag');
    expect(scss).toContain('card-rating-tag--leisure');
    expect(scss).toContain('card-rating-tag--classic');
  });

  test('SCSS 包含 meta 信息样式', () => {
    expect(scss).toContain('card-meta');
    expect(scss).toContain('card-meta-item');
    expect(scss).toContain('card-meta-label');
    expect(scss).toContain('card-meta-value');
  });
});

describe('[Unit] 天气服务文件', () => {
  test('weather.ts 服务文件存在', () => {
    expect(fileExists('services/weather.ts')).toBe(true);
  });

  test('weather.ts 导出 getWeatherForecast', () => {
    const serviceTs = readFile('services/weather.ts');
    expect(serviceTs).toContain('getWeatherForecast');
  });

  test('weather.ts 使用正确的 API 路径', () => {
    const serviceTs = readFile('services/weather.ts');
    expect(serviceTs).toContain('/wx/weather/forecast');
  });

  test('weather.ts 导出 WeatherDay 接口', () => {
    const serviceTs = readFile('services/weather.ts');
    expect(serviceTs).toContain('export interface WeatherDay');
  });

  test('WeatherDay 包含必要字段', () => {
    const serviceTs = readFile('services/weather.ts');
    expect(serviceTs).toContain('date: string');
    expect(serviceTs).toContain('tempMax: string');
    expect(serviceTs).toContain('tempMin: string');
    expect(serviceTs).toContain('textDay: string');
  });
});

describe('[Unit] itinerary-detail 天气集成', () => {
  let pageTs, pageWxml, pageSCSS;

  beforeAll(() => {
    pageTs = readFile('pages/itinerary-detail/index.ts');
    pageWxml = readFile('pages/itinerary-detail/index.wxml');
    pageSCSS = readFile('pages/itinerary-detail/index.scss');
  });

  test('导入了 getWeatherForecast', () => {
    expect(pageTs).toContain('getWeatherForecast');
  });

  test('导入了 WeatherDay 类型', () => {
    expect(pageTs).toContain('WeatherDay');
  });

  test('data 中包含 weatherList', () => {
    expect(pageTs).toContain('weatherList');
  });

  test('data 中包含 currentDayWeather', () => {
    expect(pageTs).toContain('currentDayWeather');
  });

  test('包含 loadWeather 方法', () => {
    expect(pageTs).toContain('loadWeather');
  });

  test('包含 matchWeatherForDay 方法', () => {
    expect(pageTs).toContain('matchWeatherForDay');
  });

  test('onDayTap 更新 currentDayWeather', () => {
    const onDayTapIdx = pageTs.indexOf('onDayTap');
    const afterOnDayTap = pageTs.substring(onDayTapIdx, onDayTapIdx + 500);
    expect(afterOnDayTap).toContain('currentDayWeather');
  });

  test('WXML 包含天气展示区域', () => {
    expect(pageWxml).toContain('currentDayWeather');
    expect(pageWxml).toContain('weather-bar');
  });

  test('天气展示温度范围', () => {
    expect(pageWxml).toContain('currentDayWeather.tempMin');
    expect(pageWxml).toContain('currentDayWeather.tempMax');
  });

  test('天气展示天气描述', () => {
    expect(pageWxml).toContain('currentDayWeather.textDay');
  });

  test('天气展示风向和湿度', () => {
    expect(pageWxml).toContain('currentDayWeather.windDirDay');
    expect(pageWxml).toContain('currentDayWeather.humidity');
  });

  test('天气区域在 Day 导航下方', () => {
    const dayNavIdx = pageWxml.indexOf('day-nav-wrapper');
    const weatherIdx = pageWxml.indexOf('weather-bar');
    expect(weatherIdx).toBeGreaterThan(dayNavIdx);
  });

  test('SCSS 包含天气样式', () => {
    expect(pageSCSS).toContain('.weather-bar');
    expect(pageSCSS).toContain('.weather-info');
    expect(pageSCSS).toContain('.weather-text');
    expect(pageSCSS).toContain('.weather-temp');
  });
});

describe('[Unit] TravelAttraction 类型包含必要字段', () => {
  let attractionType;

  beforeAll(() => {
    attractionType = readFile('types/attraction.ts');
  });

  test('包含 classicRating 字段', () => {
    expect(attractionType).toContain('classicRating');
  });

  test('包含 leisureRating 字段', () => {
    expect(attractionType).toContain('leisureRating');
  });

  test('包含 visitDuration 字段', () => {
    expect(attractionType).toContain('visitDuration');
  });

  test('包含 openTime 字段', () => {
    expect(attractionType).toContain('openTime');
  });

  test('包含 ticketPriceA 字段', () => {
    expect(attractionType).toContain('ticketPriceA');
  });

  test('包含 ticketPriceC 字段', () => {
    expect(attractionType).toContain('ticketPriceC');
  });
});
