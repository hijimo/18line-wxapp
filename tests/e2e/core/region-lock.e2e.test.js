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

describe('core business 创建页地区跟随「当地」可切换县域 (需求3)', () => {
  let miniProgram;

  beforeAll(async () => {
    miniProgram = await launchMiniProgram();
    await installE2eMocks(miniProgram);
    await ensureAuthenticated(miniProgram);
  }, 60000);

  afterAll(async () => {
    if (miniProgram) {
      // 清掉可能残留的「当地」选择，避免污染后续套件
      await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
      await restoreE2eMocks(miniProgram);
      await miniProgram.close();
    }
  });

  test('3.1 创建页省市固定丽水市，默认县域为松阳县且提供 selector 切换器', async () => {
    await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
    const page = await miniProgram.reLaunch(PAGES.CREATE_ITINERARY);
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.provinceName).toBe('浙江省');
    expect(data.cityName).toBe('丽水市');
    expect(data.districtName).toBe('松阳县');
    expect(data.provinceCode).toBe('330000');
    expect(data.cityCode).toBe('331100');
    expect(data.districtCode).toBe('331124');
    expect(data.districtOptions.map((o) => o.code)).toEqual(['331124', '331122', '330100']);

    // 旧的三级 region picker 不应存在；改为县域 selector picker
    expect(await page.$('picker[mode="region"]')).toBeNull();
    expect(await page.$('.region-picker')).not.toBeNull();
    expect(await page.$('.region-locked')).toBeNull();
  });

  test('3.2 提示文案说明支持松阳县、缙云县、杭州市', async () => {
    const page = await miniProgram.currentPage();
    const tip = await page.$('.region-tip');
    expect(tip).not.toBeNull();
    const tipText = await tip.text();
    expect(tipText).toContain('松阳县');
    expect(tipText).toContain('缙云县');
    expect(tipText).toContain('杭州市');
  });

  test('3.3 切换到缙云县后数据更新并持久化到「当地」', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onDistrictChange', { detail: { value: 1 } });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.districtIndex).toBe(1);
    expect(data.districtCode).toBe('331122');
    expect(data.districtName).toBe('缙云县');

    const stored = await miniProgram.evaluate(() => wx.getStorageSync('home_district'));
    expect(stored).toBe('331122');
  });

  test('3.4 提交携带缙云 code', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.currentPage();

    await page.callMethod('onDateConfirm', {
      detail: {
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        startDateDisplay: '08.01',
        endDateDisplay: '08.03',
      },
    });
    await page.callMethod('onPreferenceToggle', {
      currentTarget: { dataset: { value: 'nature' } },
    });
    await page.callMethod('onBlindModeSelect', {
      currentTarget: { dataset: { value: '1' } },
    });
    await page.callMethod('onManualPlan');
    await page.waitFor(TIMEOUTS.NETWORK);

    const requests = await getRecordedRequests(miniProgram);
    const addRequest = requests.find((req) => req.url.indexOf('/wx/itinerary/add') >= 0);
    expect(addRequest).toBeDefined();
    expect(addRequest.data.province).toBe('330000');
    expect(addRequest.data.city).toBe('331100');
    expect(addRequest.data.district).toBe('331122');
  });

  test('3.5 「当地」已选缙云时，重新进入创建页默认缙云县', async () => {
    await miniProgram.evaluate(() => wx.setStorageSync('home_district', '331122'));
    const page = await miniProgram.reLaunch(PAGES.CREATE_ITINERARY);
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.districtCode).toBe('331122');
    expect(data.districtName).toBe('缙云县');
    expect(data.districtIndex).toBe(1);

    // 还原默认，避免影响后续套件
    await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
  });

  test('3.6 切换到杭州市：市级选项 city=330100 且 district 为空', async () => {
    await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
    const page = await miniProgram.reLaunch(PAGES.CREATE_ITINERARY);
    await page.waitFor(TIMEOUTS.NETWORK);

    await page.callMethod('onDistrictChange', { detail: { value: 2 } });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.districtIndex).toBe(2);
    expect(data.districtOptionCode).toBe('330100');
    expect(data.provinceCode).toBe('330000');
    expect(data.cityCode).toBe('330100');
    expect(data.districtCode).toBe('');
    expect(data.cityName).toBe('杭州市');
    expect(data.districtName).toBe('');
    expect(data.regionText).toBe('浙江省 杭州市');

    const stored = await miniProgram.evaluate(() => wx.getStorageSync('home_district'));
    expect(stored).toBe('330100');

    await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
  });
});
