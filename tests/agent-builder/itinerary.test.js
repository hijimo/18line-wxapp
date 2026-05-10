/**
 * Agent Builder - 行程功能验证
 *
 * 验证创建行程页面和行程详情页面的功能正确性。
 */
const automator = require('miniprogram-automator');
const { AUTOMATOR_CONFIG, PAGES, TIMEOUTS } = require('../shared/config');
const { mockLogin } = require('../shared/automator-helper');

let miniProgram;

beforeAll(async () => {
  miniProgram = await automator.launch(AUTOMATOR_CONFIG);
  await mockLogin(miniProgram);
}, 60000);

afterAll(async () => {
  if (miniProgram) await miniProgram.close();
});

describe('[Builder] 创建行程页面渲染', () => {
  beforeAll(async () => {
    await miniProgram.navigateTo(PAGES.CREATE_ITINERARY);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
  });

  test('页面正确渲染导航栏', async () => {
    const page = await miniProgram.currentPage();
    const navBar = await page.$('navigation-bar');
    expect(navBar).not.toBeNull();
  });

  test('目的地选择区域存在', async () => {
    const page = await miniProgram.currentPage();
    const regionSection = await page.$('.region-section');
    expect(regionSection).not.toBeNull();
  });

  test('日期选择区域存在', async () => {
    const page = await miniProgram.currentPage();
    const dateSection = await page.$('.date-section');
    expect(dateSection).not.toBeNull();
  });

  test('偏好标签正确加载', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.preferenceOptions).toBeDefined();
    expect(Array.isArray(data.preferenceOptions)).toBe(true);
  });

  test('AI规划按钮存在', async () => {
    const page = await miniProgram.currentPage();
    const aiBtn = await page.$('.btn-ai');
    expect(aiBtn).not.toBeNull();
  });

  test('自主规划按钮存在', async () => {
    const page = await miniProgram.currentPage();
    const manualBtn = await page.$('.btn-manual');
    expect(manualBtn).not.toBeNull();
  });
});

describe('[Builder] 创建行程页面逻辑', () => {
  test('初始loading状态为false', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.loading).toBe(false);
  });

  test('calculateDays正确计算天数', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({
      startDate: '2026-05-10',
      endDate: '2026-05-10',
    });
    const days1 = await page.callMethod('calculateDays');
    expect(days1).toBe(1);

    await page.setData({
      startDate: '2026-05-10',
      endDate: '2026-05-12',
    });
    const days3 = await page.callMethod('calculateDays');
    expect(days3).toBe(3);
  });

  test('偏好标签可以切换选中状态', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();

    if (data.preferenceOptions && data.preferenceOptions.length > 0) {
      await page.callMethod('onPreferenceToggle', {
        currentTarget: { dataset: { value: data.preferenceOptions[0].dictValue } },
      });
      await page.waitFor(TIMEOUTS.TAP_DELAY);

      const newData = await page.data();
      expect(newData.preferences).toContain(data.preferenceOptions[0].dictValue);
    }
  });

  test('未填写必要信息时AI规划应提示', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({
      provinceName: '',
      startDate: '',
      endDate: '',
    });

    await page.callMethod('onAIPlan');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.loading).toBe(false);
  });

  test('填写完整信息后AI规划触发loading', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({
      provinceName: '浙江省',
      cityName: '杭州市',
      districtName: '西湖区',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
    });

    await miniProgram.mockWxMethod('request', {
      data: {
        code: 200,
        data: { itineraryId: 999, itineraryName: '测试行程' },
        msg: 'ok',
      },
      statusCode: 200,
    });

    await page.callMethod('onAIPlan');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.loading).toBe(true);

    await miniProgram.restoreWxMethod('request');
    await page.waitFor(TIMEOUTS.NETWORK);
  });
});

describe('[Builder] 行程详情页面渲染', () => {
  beforeAll(async () => {
    await miniProgram.mockWxMethod('request', {
      data: {
        code: 200,
        data: {
          itineraryId: 1,
          itineraryName: '杭州三日游',
          province: '浙江省',
          city: '杭州市',
          startDate: '2026-06-01',
          days: 3,
          status: '0',
          daysList: [
            {
              itineraryDayId: 1,
              dayNumber: 1,
              dayTheme: '西湖漫步',
              attractionList: [
                { attractionId: 1, attractionName: '西湖', attractionBlurb: '世界文化遗产' },
              ],
              breakfast: { diningId: 1, diningName: '知味观', avgCost: 30 },
              lunch: { diningId: 2, diningName: '楼外楼', avgCost: 120 },
              dinner: null,
              accommodation: { accommodationId: 1, accommodationName: '西湖民宿', priceMin: 300 },
              photography: null,
              car: null,
            },
            {
              itineraryDayId: 2,
              dayNumber: 2,
              dayTheme: '灵隐探幽',
              attractionList: [],
              breakfast: null,
              lunch: null,
              dinner: null,
              accommodation: null,
              photography: null,
              car: null,
            },
            {
              itineraryDayId: 3,
              dayNumber: 3,
              dayTheme: '宋城穿越',
              attractionList: [],
              breakfast: null,
              lunch: null,
              dinner: null,
              accommodation: null,
              photography: null,
              car: null,
            },
          ],
        },
        msg: 'ok',
      },
      statusCode: 200,
    });

    await miniProgram.redirectTo(PAGES.ITINERARY_DETAIL + '?id=1');
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.NETWORK);

    await miniProgram.restoreWxMethod('request');
  });

  test('页面正确加载行程数据', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.itinerary).not.toBeNull();
    expect(data.itinerary.itineraryName).toBe('杭州三日游');
  });

  test('Day导航正确渲染', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.itinerary.daysList.length).toBe(3);
    expect(data.currentDay).toBe(1);
  });

  test('当前天日程数据正确', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.currentDayData).not.toBeNull();
    expect(data.currentDayData.dayNumber).toBe(1);
    expect(data.currentDayData.attractionList.length).toBe(1);
    expect(data.currentDayData.breakfast).not.toBeNull();
    expect(data.currentDayData.lunch).not.toBeNull();
  });

  test('景点卡片正确渲染', async () => {
    const page = await miniProgram.currentPage();
    const attractionCards = await page.$$('attraction-card');
    expect(attractionCards.length).toBe(1);
  });

  test('餐饮卡片正确渲染', async () => {
    const page = await miniProgram.currentPage();
    const diningCards = await page.$$('dining-card');
    expect(diningCards.length).toBeGreaterThanOrEqual(2);
  });

  test('住宿卡片正确渲染', async () => {
    const page = await miniProgram.currentPage();
    const hotelCards = await page.$$('hotel-card');
    expect(hotelCards.length).toBe(1);
  });
});

describe('[Builder] 行程详情页面交互', () => {
  test('切换Day导航更新日程数据', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onDayTap', {
      currentTarget: { dataset: { day: 2 } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.currentDay).toBe(2);
    expect(data.currentDayData.dayNumber).toBe(2);
    expect(data.currentDayData.attractionList.length).toBe(0);
  });

  test('切换回Day1恢复数据', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onDayTap', {
      currentTarget: { dataset: { day: 1 } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.currentDay).toBe(1);
    expect(data.currentDayData.attractionList.length).toBe(1);
  });

  test('点击添加按钮打开抽屉', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onAddSpot', {
      currentTarget: { dataset: { day: 1 } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.showAddDrawer).toBe(true);
    expect(data.addDayNumber).toBe(1);
  });

  test('抽屉互斥：添加抽屉打开时不能打开简介抽屉', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onCardDetail', {
      detail: { type: 'attraction', data: { attractionId: 1 } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('');
  });

  test('关闭添加抽屉', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onDrawerClose');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.showAddDrawer).toBe(false);
  });

  test('点击卡片打开简介抽屉', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onCardDetail', {
      detail: { type: 'attraction', data: { attractionId: 1, attractionName: '西湖' } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('attraction');
    expect(data.introData.attractionName).toBe('西湖');
  });

  test('关闭简介抽屉', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onIntroClose');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('');
  });
});

describe('[Builder] 行程详情页面参数校验', () => {
  test('无效id应提示并返回', async () => {
    await miniProgram.redirectTo(PAGES.ITINERARY_DETAIL + '?id=abc');
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const data = await page.data();
    expect(data.itinerary).toBeNull();
  });

  test('缺少id应提示并返回', async () => {
    await miniProgram.redirectTo(PAGES.ITINERARY_DETAIL);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const data = await page.data();
    expect(data.itinerary).toBeNull();
  });

  test('负数id应提示并返回', async () => {
    await miniProgram.redirectTo(PAGES.ITINERARY_DETAIL + '?id=-1');
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const data = await page.data();
    expect(data.itinerary).toBeNull();
  });
});
