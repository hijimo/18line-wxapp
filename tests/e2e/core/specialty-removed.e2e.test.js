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

describe('core business 详情页移除地方特色菜 (需求4)', () => {
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

  test('4.1 详情页无「地方特色菜」区块', async () => {
    const page = await miniProgram.navigateTo(PAGES.ITINERARY_DETAIL + '?id=8801');
    await page.waitFor(TIMEOUTS.NETWORK);

    // specialty-section should not be rendered (commented out)
    const specialtySection = await page.$('.specialty-section');
    expect(specialtySection).toBeNull();

    // Also verify the data: localSpecialtyList should be empty
    const data = await page.data();
    expect(data.localSpecialtyList).toEqual([]);
  });

  test('4.2 不再请求 /wx/localSpecialty/list', async () => {
    const requests = await getRecordedRequests(miniProgram);
    const specialtyRequest = requests.find(
      (req) => req.url.indexOf('/wx/localSpecialty/list') >= 0,
    );
    expect(specialtyRequest).toBeUndefined();
  });

  test('4.3 其它区块不受影响', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();

    // itinerary data loaded correctly
    expect(data.itinerary.itineraryName).toBe('E2E杭州3日游');
    expect(data.currentDayData.attractionList.length).toBe(2);

    // Day tab navigation still functional
    expect(data.currentDay).toBe(1);
    expect(data.itinerary.daysList.length).toBe(2);

    // Accommodation and dining data present
    expect(data.currentDayData.breakfast).toBeDefined();
    expect(data.currentDayData.accommodation).toBeDefined();
  });
});
