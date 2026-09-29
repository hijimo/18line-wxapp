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

describe('core business 集市本地服务 (需求6)', () => {
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

  test('6.1 集市展示四类本地服务无寻宝卡片', async () => {
    const page = await miniProgram.switchTab(PAGES.TREASURE);
    await page.waitFor(TIMEOUTS.NETWORK);

    expect(page.path).toBe('pages/treasure/index');

    const data = await page.data();
    // Should have 4 tabs: 住宿/餐饮/包车/跟拍
    expect(data.tabs).toHaveLength(4);
    expect(data.tabs.map((t) => t.id)).toEqual(['hotel', 'dining', 'car', 'photography']);
    expect(data.tabs.map((t) => t.label)).toEqual(['住宿', '餐饮', '包车', '跟拍']);

    // Default active is hotel
    expect(data.activeType).toBe('hotel');

    // List should have hotel items loaded
    expect(data.list.length).toBeGreaterThan(0);
    expect(data.list[0].accommodationName).toBeDefined();

    // No treasure/寻宝 related data
    expect(data.nearbyTreasures).toBeUndefined();
    expect(data.myTreasures).toBeUndefined();
    expect(data.foundTreasures).toBeUndefined();

    // No treasure card elements
    const treasureCard = await page.$('.treasure-card');
    expect(treasureCard).toBeNull();
    const treasureIcon = await page.$('.treasure-icon-wrap');
    expect(treasureIcon).toBeNull();
  });

  test('6.2 点项进对应 intro-drawer', async () => {
    const page = await miniProgram.currentPage();

    // Tap on a hotel item
    await page.callMethod('onItemTap', {
      currentTarget: {
        dataset: {
          item: { accommodationId: 201, accommodationName: '云端隐庐', attachments: [{ url: 'test.png' }] },
        },
      },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    let data = await page.data();
    expect(data.showIntroType).toBe('hotel');
    expect(data.introData.accommodationId).toBe(201);

    // Close drawer
    await page.callMethod('onIntroClose');
    data = await page.data();
    expect(data.showIntroType).toBe('');

    // Switch to dining tab and tap
    await page.callMethod('onTabTap', { currentTarget: { dataset: { type: 'dining' } } });
    await page.waitFor(TIMEOUTS.NETWORK);

    data = await page.data();
    expect(data.activeType).toBe('dining');
    expect(data.list.length).toBeGreaterThan(0);
    expect(data.list[0].diningName).toBeDefined();

    await page.callMethod('onItemTap', {
      currentTarget: {
        dataset: {
          item: { diningId: 301, diningName: '山野食集', attachments: [{ url: 'test.png' }] },
        },
      },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    data = await page.data();
    expect(data.showIntroType).toBe('dining');
    expect(data.introData.diningId).toBe(301);

    await page.callMethod('onIntroClose');
  });

  test('6.3 区域跟随「当地」：默认松阳，切缙云后按 331122 拉取', async () => {
    // 默认（无手动选择）：松阳 331124
    await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
    await resetRecordedEvents(miniProgram);
    // 用 reLaunch 重建页面实例，保证触发首屏加载（switchTab 到当前 tab 不会触发）
    await miniProgram.reLaunch(PAGES.TREASURE);
    await (await miniProgram.currentPage()).waitFor(TIMEOUTS.NETWORK);

    let requests = await getRecordedRequests(miniProgram);
    let hotelListReq = requests.find(
      (req) => req.url.indexOf('/wx/accommodation/list') >= 0,
    );
    expect(hotelListReq).toBeDefined();
    expect(hotelListReq.data.province).toBe('330000');
    expect(hotelListReq.data.city).toBe('331100');
    expect(hotelListReq.data.district).toBe('331124');

    // 「当地」切到缙云后重进集市：按 331122 拉取
    await miniProgram.evaluate(() => wx.setStorageSync('home_district', '331122'));
    await resetRecordedEvents(miniProgram);
    await miniProgram.reLaunch(PAGES.TREASURE);
    await (await miniProgram.currentPage()).waitFor(TIMEOUTS.NETWORK);

    requests = await getRecordedRequests(miniProgram);
    hotelListReq = requests.find(
      (req) => req.url.indexOf('/wx/accommodation/list') >= 0,
    );
    expect(hotelListReq).toBeDefined();
    expect(hotelListReq.data.district).toBe('331122');

    // 还原默认，避免影响后续用例/套件
    await miniProgram.evaluate(() => wx.removeStorageSync('home_district'));
    await miniProgram.reLaunch(PAGES.TREASURE);
    await (await miniProgram.currentPage()).waitFor(TIMEOUTS.NETWORK);
  });

  test('6.4 空态占位', async () => {
    const page = await miniProgram.currentPage();

    // Mock scenario: photography tab with empty results
    // We simulate by setting data directly (since mock returns data for all)
    await page.setData({ list: [], loading: false, activeType: 'photography' });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    // Verify empty state element exists
    const emptyState = await page.$('.empty-state');
    expect(emptyState).not.toBeNull();

    // Page should not throw or collapse
    const data = await page.data();
    expect(data.list).toEqual([]);
    expect(data.loading).toBe(false);
  });

  test('6.5 无寻宝残留入口', async () => {
    const page = await miniProgram.switchTab(PAGES.TREASURE);
    await page.waitFor(TIMEOUTS.NETWORK);

    // No treasure-related elements
    const bellIcon = await page.$('.bell-icon');
    expect(bellIcon).toBeNull();
    const treasureTab = await page.$('.treasure-tab');
    expect(treasureTab).toBeNull();

    // Tab navigation between index/treasure/mine still works
    const indexPage = await miniProgram.switchTab(PAGES.INDEX);
    await indexPage.waitFor(TIMEOUTS.NETWORK);
    expect(indexPage.path).toBe('pages/index/index');

    const minePage = await miniProgram.switchTab(PAGES.MINE);
    await minePage.waitFor(TIMEOUTS.NETWORK);
    expect(minePage.path).toBe('pages/mine/index');

    const treasurePage = await miniProgram.switchTab(PAGES.TREASURE);
    await treasurePage.waitFor(TIMEOUTS.NETWORK);
    expect(treasurePage.path).toBe('pages/treasure/index');
  });
});
