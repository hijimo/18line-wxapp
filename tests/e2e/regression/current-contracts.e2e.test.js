const {
  ensureAuthenticated,
  getRecordedRequests,
  getRecordedToasts,
  installE2eMocks,
  launchMiniProgram,
  PAGES,
  resetRecordedEvents,
  restoreE2eMocks,
  TEST_TOKEN,
  TIMEOUTS,
} = require('../shared/app');

describe('regression 当前业务回归点', () => {
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

  test('登录态丢失时业务测试 helper 会自动恢复登录态', async () => {
    await miniProgram.evaluate(() => wx.removeStorageSync('token'));
    await ensureAuthenticated(miniProgram);
    const token = await miniProgram.evaluate(() => wx.getStorageSync('token'));
    expect(token).toBe(TEST_TOKEN);
  });

  test('未同意协议点击登录不会发起登录请求', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.reLaunch(PAGES.LOGIN);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
    await page.setData({ agreed: false, code: 'e2e_login_code' });
    const loginButton = await page.$('.login-btn');
    await loginButton.tap();
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const requests = await getRecordedRequests(miniProgram);
    const toasts = await getRecordedToasts(miniProgram);
    expect(requests.some((req) => req.url.indexOf('/wx/auth/login') >= 0)).toBe(false);
    expect(toasts.some((toast) => toast.title === '请先同意用户协议和隐私政策')).toBe(true);
  });

  test('创建行程结束日期早于开始日期会阻止提交', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.reLaunch(PAGES.CREATE_ITINERARY);
    await page.waitFor(TIMEOUTS.NETWORK);

    await page.setData({
      cityCode: '330100',
      cityName: '杭州市',
      startDate: '2026-07-22',
      endDate: '2026-07-20',
    });
    await page.callMethod('onManualPlan');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const requests = await getRecordedRequests(miniProgram);
    const toasts = await getRecordedToasts(miniProgram);
    expect(requests.some((req) => req.url.indexOf('/wx/itinerary/add') >= 0)).toBe(false);
    expect(toasts.some((toast) => toast.title === '结束日期需晚于开始日期')).toBe(true);
  });

  test('首页搜索会按关键词请求模板并渲染搜索结果', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.NETWORK);

    await page.callMethod('onSearchOpen');
    await page.callMethod('runSearch', '梯田');
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.searchActive).toBe(true);
    expect(data.searchHint).toBe('搜索结果');
    expect(data.searchResults[0].title).toContain('梯田');

    const requests = await getRecordedRequests(miniProgram);
    expect(
      requests.some(
        (req) => req.url.indexOf('/wx/template/list') >= 0 && req.data.keyword === '梯田',
      ),
    ).toBe(true);
  });
});
