/**
 * Agent Reviewer - 行程功能对抗验证
 *
 * 职责：寻找行程功能的边界情况和潜在缺陷。
 * 策略：模拟异常操作路径，验证防御性逻辑。
 * 立场：悲观派 —— 尝试让功能失败。
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

describe('[Reviewer] 创建行程边界测试', () => {
  beforeAll(async () => {
    await miniProgram.navigateTo(PAGES.CREATE_ITINERARY);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
  });

  test('结束日期早于开始日期应阻止提交', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({
      provinceName: '浙江省',
      cityName: '杭州市',
      districtName: '西湖区',
      startDate: '2026-06-05',
      endDate: '2026-06-01',
    });

    await page.callMethod('onAIPlan');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.loading).toBe(false);
  });

  test('重复快速点击AI规划不应重复请求', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({
      provinceName: '浙江省',
      cityName: '杭州市',
      districtName: '西湖区',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      loading: true,
    });

    await page.callMethod('onAIPlan');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.loading).toBe(true);
  });

  test('网络失败时loading应恢复为false', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({
      provinceName: '浙江省',
      cityName: '杭州市',
      districtName: '西湖区',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      loading: false,
    });

    await miniProgram.mockWxMethod('request', {
      data: { code: 500, msg: '服务器错误', data: null },
      statusCode: 200,
    });

    await page.callMethod('onAIPlan');
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.loading).toBe(false);

    await miniProgram.restoreWxMethod('request');
  });

  test('超长行程天数（30天）应能正常计算', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });

    const days = await page.callMethod('calculateDays');
    expect(days).toBe(30);
  });
});

describe('[Reviewer] 行程详情边界测试', () => {
  beforeAll(async () => {
    await miniProgram.mockWxMethod('request', {
      data: {
        code: 200,
        data: {
          itineraryId: 1,
          itineraryName: '测试行程',
          days: 2,
          daysList: [
            {
              itineraryDayId: 1,
              dayNumber: 1,
              attractionList: [],
              breakfast: null,
              lunch: null,
              dinner: null,
              accommodation: null,
              photography: null,
              car: null,
            },
            {
              itineraryDayId: 2,
              dayNumber: 2,
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

  test('空日程应正确渲染（无卡片，有添加按钮）', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.currentDayData.attractionList.length).toBe(0);
    expect(data.currentDayData.breakfast).toBeNull();

    const attractionCards = await page.$$('attraction-card');
    expect(attractionCards.length).toBe(0);
  });

  test('快速切换Day不应导致数据错乱', async () => {
    const page = await miniProgram.currentPage();

    await page.callMethod('onDayTap', { currentTarget: { dataset: { day: 2 } } });
    await page.callMethod('onDayTap', { currentTarget: { dataset: { day: 1 } } });
    await page.callMethod('onDayTap', { currentTarget: { dataset: { day: 2 } } });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.currentDay).toBe(2);
    expect(data.currentDayData.dayNumber).toBe(2);
  });

  test('抽屉关闭后再打开状态应重置', async () => {
    const page = await miniProgram.currentPage();

    await page.callMethod('onAddSpot', { currentTarget: { dataset: { day: 1 } } });
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    expect((await page.data()).showAddDrawer).toBe(true);

    await page.callMethod('onDrawerClose');
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    expect((await page.data()).showAddDrawer).toBe(false);

    await page.callMethod('onAddSpot', { currentTarget: { dataset: { day: 2 } } });
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    const data = await page.data();
    expect(data.showAddDrawer).toBe(true);
    expect(data.addDayNumber).toBe(2);

    await page.callMethod('onDrawerClose');
  });

  test('简介抽屉互斥：不能同时打开两个', async () => {
    const page = await miniProgram.currentPage();

    await page.callMethod('onCardDetail', {
      detail: { type: 'hotel', data: { accommodationId: 1 } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    expect((await page.data()).showIntroDrawer).toBe('hotel');

    await page.callMethod('onCardDetail', {
      detail: { type: 'dining', data: { diningId: 1 } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('hotel');

    await page.callMethod('onIntroClose');
  });

  test('loadItinerary网络失败时不应崩溃', async () => {
    const page = await miniProgram.currentPage();

    await miniProgram.mockWxMethod('request', {
      data: { code: 500, msg: '网络错误', data: null },
      statusCode: 200,
    });

    await page.callMethod('loadItinerary');
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.loading).toBe(false);

    await miniProgram.restoreWxMethod('request');
  });
});

describe('[Reviewer] 添加日程抽屉边界测试', () => {
  test('add-schedule-drawer组件存在', async () => {
    const page = await miniProgram.currentPage();
    const drawer = await page.$('add-schedule-drawer');
    expect(drawer).not.toBeNull();
  });

  test('抽屉打开时应加载默认tab数据', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onAddSpot', { currentTarget: { dataset: { day: 1 } } });
    await page.waitFor(TIMEOUTS.NETWORK);

    const drawer = await page.$('add-schedule-drawer');
    if (drawer) {
      const drawerData = await drawer.data();
      expect(drawerData.activeTab).toBe('attraction');
      expect(drawerData.listLoading).toBeDefined();
    }

    await page.callMethod('onDrawerClose');
  });
});
