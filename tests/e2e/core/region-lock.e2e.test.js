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

describe('core business 创建页地区锁定松阳 (需求3)', () => {
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

  test('3.1 创建页地区固定显示浙江省丽水市松阳县且不可改选', async () => {
    const page = await miniProgram.navigateTo(PAGES.CREATE_ITINERARY);
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.provinceName).toBe('浙江省');
    expect(data.cityName).toBe('丽水市');
    expect(data.districtName).toBe('松阳县');
    expect(data.provinceCode).toBe('330000');
    expect(data.cityCode).toBe('331100');
    expect(data.districtCode).toBe('331124');

    // region picker should not exist (replaced with locked display)
    const picker = await page.$('picker[mode="region"]');
    expect(picker).toBeNull();

    // locked region display should exist
    const regionLocked = await page.$('.region-locked');
    expect(regionLocked).not.toBeNull();
  });

  test('3.2 提示文案「目前只上线松阳县」可见', async () => {
    const page = await miniProgram.currentPage();
    const tip = await page.$('.region-tip');
    expect(tip).not.toBeNull();
    const tipText = await tip.text();
    expect(tipText).toContain('目前只上线松阳县');
  });

  test('3.3 提交携带松阳 code', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.reLaunch(PAGES.CREATE_ITINERARY);
    await page.waitFor(TIMEOUTS.NETWORK);

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
    expect(addRequest.data.district).toBe('331124');
  });
});
