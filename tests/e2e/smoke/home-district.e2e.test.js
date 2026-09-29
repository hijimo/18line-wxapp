const {
  ensureAuthenticated,
  getRecordedRequests,
  installE2eMocks,
  launchMiniProgram,
  PAGES,
  resetRecordedEvents,
  restoreE2eMocks,
  TIMEOUTS,
} = require('../shared/app');

describe('smoke 首页顶栏「当地」地址切换器', () => {
  let miniProgram;

  beforeAll(async () => {
    miniProgram = await launchMiniProgram();
    await installE2eMocks(miniProgram);
    await ensureAuthenticated(miniProgram);
  }, 60000);

  afterAll(async () => {
    if (miniProgram) {
      await restoreE2eMocks(miniProgram);
      await miniProgram.close();
    }
  });

  test('2.1 顶栏显示地址切换器，默认松阳县，不再有品牌箭头与通知图标', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.NETWORK);

    const picker = await page.$('.district-picker');
    expect(picker).not.toBeNull();

    const name = await page.$('.district-picker-name');
    expect(name).not.toBeNull();

    const data = await page.data();
    expect(data.currentDistrict).toBe('331124');
    expect(data.currentDistrictName).toBe('松阳县');
    expect(data.districtOptions.map((o) => o.code)).toEqual(['331124', '331122', '330100']);
    expect(data.districtOptions.map((o) => o.name)).toEqual(['松阳县', '缙云县', '杭州市']);

    // 旧顶栏元素已移除
    expect(await page.$('.top-bar-arrow')).toBeNull();
    expect(await page.$('.top-bar-brand')).toBeNull();
    expect(await page.$('.top-bar-bell')).toBeNull();
    expect(await page.$('.top-bar-create-btn')).toBeNull();

    // 创建行程入口移到悬浮按钮
    expect(await page.$('.create-fab')).not.toBeNull();
  });

  test('2.2 切换到缙云县后按 331122 拉取当地三列表并持久化', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.NETWORK);
    await resetRecordedEvents(miniProgram);

    await page.callMethod('onDistrictChange', { detail: { value: 1 } });
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.currentDistrict).toBe('331122');
    expect(data.currentDistrictName).toBe('缙云县');
    expect(data.districtIndex).toBe(1);

    const requests = await getRecordedRequests(miniProgram);
    const attractionReq = requests.find((req) => req.url.indexOf('/wx/attraction/list') >= 0);
    expect(attractionReq).toBeDefined();
    expect(attractionReq.data.district).toBe('331122');
    const dishReq = requests.find((req) => req.url.indexOf('/wx/dish/featured') >= 0);
    expect(dishReq).toBeDefined();
    expect(dishReq.data.district).toBe('331122');

    const stored = await miniProgram.evaluate(() => wx.getStorageSync('home_district'));
    expect(stored).toBe('331122');

    // 还原默认，避免影响后续用例
    await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
  });

  test('2.3 切换到杭州市后按市级 330100 拉取，不下发 district', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.NETWORK);
    await resetRecordedEvents(miniProgram);

    await page.callMethod('onDistrictChange', { detail: { value: 2 } });
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.currentDistrict).toBe('330100');
    expect(data.currentDistrictName).toBe('杭州市');
    expect(data.districtIndex).toBe(2);

    const requests = await getRecordedRequests(miniProgram);
    const attractionReq = requests.find((req) => req.url.indexOf('/wx/attraction/list') >= 0);
    expect(attractionReq).toBeDefined();
    expect(attractionReq.data.province).toBe('330000');
    expect(attractionReq.data.city).toBe('330100');
    // 市级选项不带 district，避免后端按区县精确匹配查不到数据
    expect(attractionReq.data.district).toBeUndefined();

    const dishReq = requests.find((req) => req.url.indexOf('/wx/dish/featured') >= 0);
    expect(dishReq).toBeDefined();
    expect(dishReq.data.city).toBe('330100');
    expect(dishReq.data.district).toBeUndefined();

    const stored = await miniProgram.evaluate(() => wx.getStorageSync('home_district'));
    expect(stored).toBe('330100');

    // 还原默认，避免影响后续用例
    await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
  });
});
