/**
 * 行程功能 - 单元测试（不依赖微信开发者工具）
 *
 * 验证页面逻辑、数据结构、组件接口的正确性。
 * 通过直接读取源文件进行静态分析和逻辑验证。
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

describe('[Unit] 文件完整性验证', () => {
  const pages = ['pages/create-itinerary', 'pages/itinerary-detail'];
  const components = [
    'components/base-drawer',
    'components/add-schedule-drawer',
    'components/attraction-card',
    'components/hotel-card',
    'components/dining-card',
    'components/car-card',
    'components/photography-card',
    'components/attraction-intro-drawer',
    'components/hotel-intro-drawer',
    'components/dining-intro-drawer',
    'components/car-intro-drawer',
    'components/photography-intro-drawer',
  ];

  pages.forEach((page) => {
    const name = page.split('/').pop();
    test(`${name} 页面四个文件完整`, () => {
      expect(fileExists(`${page}/index.ts`)).toBe(true);
      expect(fileExists(`${page}/index.wxml`)).toBe(true);
      expect(fileExists(`${page}/index.scss`)).toBe(true);
      expect(fileExists(`${page}/index.json`)).toBe(true);
    });
  });

  components.forEach((comp) => {
    const name = comp.split('/').pop();
    test(`${name} 组件四个文件完整`, () => {
      expect(fileExists(`${comp}/${name}.ts`)).toBe(true);
      expect(fileExists(`${comp}/${name}.wxml`)).toBe(true);
      expect(fileExists(`${comp}/${name}.scss`)).toBe(true);
      expect(fileExists(`${comp}/${name}.json`)).toBe(true);
    });
  });

  test('photography.ts 服务文件存在', () => {
    expect(fileExists('services/photography.ts')).toBe(true);
  });
});

describe('[Unit] app.json 页面注册', () => {
  let appJson;

  beforeAll(() => {
    const appJsonPath = path.join(ROOT, 'app.json');
    appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
  });

  test('create-itinerary 已注册', () => {
    expect(appJson.pages).toContain('pages/create-itinerary/index');
  });

  test('itinerary-detail 已注册', () => {
    expect(appJson.pages).toContain('pages/itinerary-detail/index');
  });
});

describe('[Unit] itinerary-detail/index.json 组件注册', () => {
  let pageJson;

  beforeAll(() => {
    pageJson = JSON.parse(readFile('pages/itinerary-detail/index.json'));
  });

  test('usingComponents 包含所有必要组件', () => {
    const components = pageJson.usingComponents || {};
    const required = [
      'attraction-card',
      'hotel-card',
      'dining-card',
      'car-card',
      'photography-card',
      'add-schedule-drawer',
      'attraction-intro-drawer',
      'hotel-intro-drawer',
      'dining-intro-drawer',
      'car-intro-drawer',
      'photography-intro-drawer',
    ];

    required.forEach((comp) => {
      expect(Object.keys(components)).toContain(comp);
    });
  });

  test('组件路径指向存在的文件', () => {
    const components = pageJson.usingComponents || {};
    Object.entries(components).forEach(([name, compPath]) => {
      const tsPath = compPath.replace(/^\//, '') + '.ts';
      expect(fileExists(tsPath)).toBe(true);
    });
  });
});

describe('[Unit] 组件 JSON 格式验证', () => {
  const components = [
    'base-drawer',
    'add-schedule-drawer',
    'attraction-card',
    'hotel-card',
    'dining-card',
    'car-card',
    'photography-card',
    'attraction-intro-drawer',
    'hotel-intro-drawer',
    'dining-intro-drawer',
    'car-intro-drawer',
    'photography-intro-drawer',
  ];

  components.forEach((name) => {
    test(`${name}.json 是有效的组件配置`, () => {
      const content = readFile(`components/${name}/${name}.json`);
      const json = JSON.parse(content);
      expect(json.component).toBe(true);
    });
  });
});

describe('[Unit] create-itinerary 页面逻辑验证', () => {
  let pageTs;

  beforeAll(() => {
    pageTs = readFile('pages/create-itinerary/index.ts');
  });

  test('导入了 autoGenerateItinerary', () => {
    expect(pageTs).toContain('autoGenerateItinerary');
  });

  test('导入了 addItinerary', () => {
    expect(pageTs).toContain('addItinerary');
  });

  test('导入了 getRegionTree 或 getProvinces', () => {
    expect(pageTs.includes('getRegionTree') || pageTs.includes('getProvinces')).toBe(true);
  });

  test('导入了 getDictByType', () => {
    expect(pageTs).toContain('getDictByType');
  });

  test('使用 wx.redirectTo 而非 navigateTo', () => {
    expect(pageTs).toContain('wx.redirectTo');
    expect(pageTs).not.toContain('wx.navigateTo');
  });

  test('包含 calculateDays 方法', () => {
    expect(pageTs).toContain('calculateDays');
  });

  test('包含 loading 状态管理', () => {
    expect(pageTs).toContain('loading: true');
    expect(pageTs).toContain('loading: false');
  });

  test('AI生成时调用 setKeepScreenOn', () => {
    expect(pageTs).toContain('setKeepScreenOn');
  });

  test('使用 travel_tourist_like 字典类型', () => {
    expect(pageTs).toContain('travel_tourist_like');
  });
});

describe('[Unit] itinerary-detail 页面逻辑验证', () => {
  let pageTs;

  beforeAll(() => {
    pageTs = readFile('pages/itinerary-detail/index.ts');
  });

  test('导入了 getItinerary', () => {
    expect(pageTs).toContain('getItinerary');
  });

  test('onLoad 中校验 id 参数', () => {
    expect(pageTs).toContain('isNaN') ;
  });

  test('包含 loadItinerary 方法', () => {
    expect(pageTs).toContain('loadItinerary');
  });

  test('包含 onDayTap 方法', () => {
    expect(pageTs).toContain('onDayTap');
  });

  test('包含 onAddSpot 方法', () => {
    expect(pageTs).toContain('onAddSpot');
  });

  test('包含 onCardDetail 方法', () => {
    expect(pageTs).toContain('onCardDetail');
  });

  test('包含 onScheduleRefresh 方法', () => {
    expect(pageTs).toContain('onScheduleRefresh');
  });

  test('包含 onDrawerClose 方法', () => {
    expect(pageTs).toContain('onDrawerClose');
  });

  test('包含 onIntroClose 方法', () => {
    expect(pageTs).toContain('onIntroClose');
  });

  test('包含抽屉互斥逻辑', () => {
    expect(pageTs).toContain('showAddDrawer');
    expect(pageTs).toContain('showIntroDrawer');
  });
});

describe('[Unit] 首页行程卡片日期展示', () => {
  let indexTs;

  beforeAll(() => {
    indexTs = readFile('pages/index/index.ts');
  });

  test('journey-card 使用 MM.DD-MM.DD 日期范围', () => {
    expect(indexTs).toContain('function formatJourneyDateRange');
    expect(indexTs).toContain("return `${formatMonthDay(start)}-${formatMonthDay(end)}`");
    expect(indexTs).toContain('date: formatJourneyDateRange(item.startDate, item.days)');
  });
});

describe('[Unit] add-schedule-drawer 逻辑验证', () => {
  let compTs;

  beforeAll(() => {
    compTs = readFile('components/add-schedule-drawer/add-schedule-drawer.ts');
  });

  test('导入了 getAttractionList', () => {
    expect(compTs).toContain('getAttractionList');
  });

  test('导入了 getAccommodationList', () => {
    expect(compTs).toContain('getAccommodationList');
  });

  test('导入了 getDiningList', () => {
    expect(compTs).toContain('getDiningList');
  });

  test('导入了 getCarList', () => {
    expect(compTs).toContain('getCarList');
  });

  test('导入了 getPhotographyList', () => {
    expect(compTs).toContain('getPhotographyList');
  });

  test('导入了 updateDayAttractions', () => {
    expect(compTs).toContain('updateDayAttractions');
  });

  test('导入了 updateDayDining', () => {
    expect(compTs).toContain('updateDayDining');
  });

  test('导入了 updateDayAccommodation', () => {
    expect(compTs).toContain('updateDayAccommodation');
  });

  test('导入了 addCar', () => {
    expect(compTs).toContain('addCar');
  });

  test('导入了 addPhotography', () => {
    expect(compTs).toContain('addPhotography');
  });

  test('包车和跟拍添加时传入 dayNumber', () => {
    expect(compTs).toContain('await addCar({ itineraryId, dayNumber, carId: item.carId })');
    expect(compTs).toContain('await addPhotography({ itineraryId, dayNumber, photographyId: item.photographyId })');
  });

  test('包含 showActionSheet 餐饮选择', () => {
    expect(compTs).toContain('showActionSheet');
  });

  test('包含防抖逻辑（setTimeout）', () => {
    expect(compTs).toContain('setTimeout');
  });

  test('包含 triggerEvent refresh', () => {
    expect(compTs).toContain("triggerEvent('refresh')");
  });

  test('包含 5 个 tab', () => {
    expect(compTs).toContain('attraction');
    expect(compTs).toContain('hotel');
    expect(compTs).toContain('dining');
    expect(compTs).toContain('car');
    expect(compTs).toContain('photography');
  });
});

describe('[Unit] 卡片组件接口验证', () => {
  const cards = ['attraction-card', 'hotel-card', 'dining-card', 'car-card', 'photography-card'];

  cards.forEach((name) => {
    test(`${name} 触发 carddetail 事件`, () => {
      const ts = readFile(`components/${name}/${name}.ts`);
      expect(ts).toContain('carddetail');
    });
  });

  test('dining-card 包含 meal 属性', () => {
    const ts = readFile('components/dining-card/dining-card.ts');
    expect(ts).toContain('meal');
  });
});

describe('[Unit] base-drawer 组件验证', () => {
  let wxml, ts;

  beforeAll(() => {
    wxml = readFile('components/base-drawer/base-drawer.wxml');
    ts = readFile('components/base-drawer/base-drawer.ts');
  });

  test('使用 root-portal', () => {
    expect(wxml).toContain('root-portal');
  });

  test('包含 catchtouchmove 防穿透', () => {
    expect(wxml).toContain('catchtouchmove');
  });

  test('包含 noop 方法', () => {
    expect(ts).toContain('noop');
  });

  test('触发 close 事件', () => {
    expect(ts).toContain("triggerEvent('close')");
  });

  test('包含 show 和 height 属性', () => {
    expect(ts).toContain('show');
    expect(ts).toContain('height');
  });
});

describe('[Unit] WXML 字段引用验证', () => {
  let wxml;

  beforeAll(() => {
    wxml = readFile('pages/itinerary-detail/index.wxml');
  });

  test('引用 currentDayData.attractionList', () => {
    expect(wxml).toContain('currentDayData.attractionList');
  });

  test('引用 currentDayData.breakfast', () => {
    expect(wxml).toContain('currentDayData.breakfast');
  });

  test('引用 currentDayData.lunch', () => {
    expect(wxml).toContain('currentDayData.lunch');
  });

  test('引用 currentDayData.dinner', () => {
    expect(wxml).toContain('currentDayData.dinner');
  });

  test('引用 currentDayData.accommodation', () => {
    expect(wxml).toContain('currentDayData.accommodation');
  });

  test('引用 currentDayData.photography', () => {
    expect(wxml).toContain('currentDayData.photography');
  });

  test('引用 currentDayData.car', () => {
    expect(wxml).toContain('currentDayData.car');
  });

  test('dining-card 传入 meal 属性', () => {
    expect(wxml).toContain('meal=');
  });
});

describe('[Unit] photography.ts 服务验证', () => {
  let serviceTs;

  beforeAll(() => {
    serviceTs = readFile('services/photography.ts');
  });

  test('导出 getPhotographyList', () => {
    expect(serviceTs).toContain('getPhotographyList');
  });

  test('导出 getPhotographyDetail', () => {
    expect(serviceTs).toContain('getPhotographyDetail');
  });

  test('使用正确的 API 路径', () => {
    expect(serviceTs).toContain('/wx/photography');
  });

  test('导入 TravelPhotography 类型', () => {
    expect(serviceTs).toContain('TravelPhotography');
  });
});

describe('[Unit] itinerary.ts 服务路径验证', () => {
  let serviceTs;

  beforeAll(() => {
    serviceTs = readFile('services/itinerary.ts');
  });

  test('包车添加接口使用日程维度路径', () => {
    expect(serviceTs).toContain('`/wx/itinerary/${itineraryId}/day/${dayNumber}/car/add`');
    expect(serviceTs).not.toContain('`/wx/itinerary/${itineraryId}/car/add`');
  });

  test('跟拍添加接口使用日程维度路径', () => {
    expect(serviceTs).toContain('`/wx/itinerary/${itineraryId}/day/${dayNumber}/photography/add`');
    expect(serviceTs).not.toContain('`/wx/itinerary/${itineraryId}/photography/add`');
  });
});
