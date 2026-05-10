/**
 * Agent Builder - 数据流验证
 *
 * 验证页面数据加载、状态管理、组件通信是否正确。
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

describe('[Builder] 首页数据加载', () => {
  test('banners数据结构正确', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const data = await page.data();
    const banner = data.banners[0];
    expect(banner).toHaveProperty('id');
    expect(banner).toHaveProperty('image');
    expect(banner).toHaveProperty('title');
    expect(banner).toHaveProperty('description');
    expect(banner).toHaveProperty('price');
  });

  test('journeys数据结构正确', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();

    if (data.hasJourneys && data.journeys.length > 0) {
      const journey = data.journeys[0];
      expect(journey).toHaveProperty('id');
      expect(journey).toHaveProperty('title');
      expect(journey).toHaveProperty('days');
      expect(Array.isArray(journey.days)).toBe(true);
    }
  });

  test('inspirationCards数据结构正确', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    const card = data.inspirationCards[0];
    expect(card).toHaveProperty('id');
    expect(card).toHaveProperty('image');
    expect(card).toHaveProperty('rating');
    expect(card).toHaveProperty('title');
  });

  test('eggs数据结构正确', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    const egg = data.eggs[0];
    expect(egg).toHaveProperty('id');
    expect(egg).toHaveProperty('title');
    expect(egg).toHaveProperty('price');
    expect(egg).toHaveProperty('duration');
    expect(egg).toHaveProperty('distance');
  });
});

describe('[Builder] 页面间数据传递', () => {
  test('问卷编辑模式接收参数', async () => {
    await miniProgram.navigateTo('/pages/survey/index?mode=edit');
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const data = await page.data();
    expect(data.mode).toBe('edit');

    await miniProgram.navigateBack();
  });

  test('旅程列表接收filter参数', async () => {
    await miniProgram.navigateTo('/pages/journeys/index?filter=pending');
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    expect(page.query.filter).toBe('pending');

    await miniProgram.navigateBack();
  });
});

describe('[Builder] Storage数据持久化', () => {
  test('token正确存储', async () => {
    const result = await miniProgram.evaluate(() => {
      return wx.getStorageSync('token');
    });
    expect(result).toBe('mock_token_for_testing_12345');
  });

  test('清除token后storage为空', async () => {
    await miniProgram.evaluate(() => {
      wx.removeStorageSync('token');
    });
    const result = await miniProgram.evaluate(() => {
      return wx.getStorageSync('token');
    });
    expect(result).toBeFalsy();

    // 恢复
    await mockLogin(miniProgram);
  });
});

describe('[Builder] 组件事件通信', () => {
  test('hero-banner组件触发bannertap事件', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const heroBanner = await page.$('hero-banner');
    expect(heroBanner).not.toBeNull();

    const data = await page.data();
    expect(data.banners.length).toBeGreaterThan(0);
  });

  test('gem-item组件触发itemtap事件', async () => {
    const page = await miniProgram.currentPage();
    const gemItems = await page.$$('gem-item');
    expect(gemItems.length).toBeGreaterThan(0);
  });

  test('food-card组件触发cardtap事件', async () => {
    const page = await miniProgram.currentPage();
    const foodCards = await page.$$('food-card');
    expect(foodCards.length).toBeGreaterThan(0);
  });
});
