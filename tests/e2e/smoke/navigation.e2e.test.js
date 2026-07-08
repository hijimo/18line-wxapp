const {
  ensureAuthenticated,
  installE2eMocks,
  launchMiniProgram,
  PAGES,
  restoreE2eMocks,
  TIMEOUTS,
} = require('../shared/app');

describe('smoke 应用启动与核心导航', () => {
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

  test('已登录状态下首页可启动并展示核心区块', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.NETWORK);

    expect(page.path).toBe('pages/index/index');
    expect(await page.$('hero-banner')).not.toBeNull();
    expect(await page.$('journey-card')).not.toBeNull();
    expect(await page.$('inspiration-card')).not.toBeNull();
  });

  test('核心 tab 和核心入口可访问', async () => {
    let page = await miniProgram.switchTab(PAGES.TREASURE);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
    expect(page.path).toBe('pages/treasure/index');

    page = await miniProgram.switchTab(PAGES.MINE);
    await page.waitFor(TIMEOUTS.NETWORK);
    expect(page.path).toBe('pages/mine/index');

    page = await miniProgram.switchTab(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.NETWORK);
    const createButton = await page.$('.top-bar-create-btn');
    expect(createButton).not.toBeNull();
    await createButton.tap();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/create-itinerary/index');
  });
});
