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

describe('core business 行程主流程', () => {
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

  test('用户可手动创建行程，提交后进入新行程详情', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.navigateTo(PAGES.CREATE_ITINERARY);
    await page.waitFor(TIMEOUTS.NETWORK);

    await page.callMethod('onRegionChange', {
      detail: {
        value: ['浙江省', '杭州市', '西湖区'],
        code: ['330000', '330100', '330106'],
      },
    });
    await page.callMethod('onDateConfirm', {
      detail: {
        startDate: '2026-07-20',
        endDate: '2026-07-22',
        startDateDisplay: '07.20',
        endDateDisplay: '07.22',
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

    const currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/itinerary-detail/index');

    const requests = await getRecordedRequests(miniProgram);
    const addRequest = requests.find((req) => req.url.indexOf('/wx/itinerary/add') >= 0);
    expect(addRequest).toBeDefined();
    expect(addRequest.data.city).toBe('330100');
    expect(addRequest.data.district).toBe('330106');
    expect(addRequest.data.days).toBe(3);
    expect(addRequest.data.preferences).toContain('nature');
    expect(addRequest.data.blindMode).toBe('1');
  });

  test('用户可查看行程详情、切换天数并修改出行日期', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.redirectTo(PAGES.ITINERARY_DETAIL + '?id=8801');
    await page.waitFor(TIMEOUTS.NETWORK);

    let data = await page.data();
    expect(data.itinerary.itineraryName).toBe('E2E杭州3日游');
    expect(data.currentDayData.attractionList.length).toBe(2);

    await page.callMethod('onDayTap', {
      currentTarget: { dataset: { day: 2 } },
    });
    data = await page.data();
    expect(data.currentDay).toBe(2);
    expect(data.currentDayData.dayNumber).toBe(2);

    await page.callMethod('onDateConfirm', {
      detail: { startDate: '2026-08-01', days: 2 },
    });
    await page.waitFor(TIMEOUTS.NETWORK);
    data = await page.data();
    expect(data.itinerary.startDate).toBe('2026-08-01');
    expect(data.itinerary.dateRangeText).toBe('08.01 - 08.02');

    const requests = await getRecordedRequests(miniProgram);
    expect(requests.some((req) => req.url.indexOf('/wx/itinerary/edit') >= 0)).toBe(true);
  });

  test('用户可从行程列表进入详情并删除行程', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.navigateTo(PAGES.JOURNEYS);
    await page.waitFor(TIMEOUTS.NETWORK);

    let data = await page.data();
    expect(data.journeys.length).toBeGreaterThan(0);
    expect(data.journeys[0].title).toBe('E2E杭州3日游');

    await page.callMethod('onJourneyTap', {
      currentTarget: { dataset: { id: 8801 } },
    });
    await page.waitFor(TIMEOUTS.NETWORK);
    let currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/itinerary-detail/index');

    await miniProgram.navigateBack();
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    await page.callMethod('deleteJourney', 8801);
    await page.waitFor(TIMEOUTS.NETWORK);

    const requests = await getRecordedRequests(miniProgram);
    expect(requests.some((req) => req.url.indexOf('/wx/itinerary/remove') >= 0)).toBe(true);
  });
});
