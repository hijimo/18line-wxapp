/**
 * Agent Reviewer - 性能与稳定性验证
 *
 * 验证内存泄漏、页面栈溢出、大数据渲染等性能问题。
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

describe('[Reviewer] 页面栈安全验证', () => {
  test('连续navigateTo不应超过10层', async () => {
    await miniProgram.reLaunch(PAGES.INDEX);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    // 尝试连续跳转
    for (let i = 0; i < 8; i++) {
      try {
        await miniProgram.navigateTo(PAGES.SURVEY);
        await new Promise((r) => setTimeout(r, 300));
      } catch (e) {
        // 预期在接近10层时会失败
      }
    }

    const pageStack = await miniProgram.pageStack();
    expect(pageStack.length).toBeLessThanOrEqual(10);

    // 清理
    await miniProgram.reLaunch(PAGES.INDEX);
  });

  test('reLaunch应清空页面栈', async () => {
    await miniProgram.navigateTo(PAGES.SURVEY);
    await miniProgram.navigateTo(PAGES.JOURNEYS);

    await miniProgram.reLaunch(PAGES.INDEX);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const pageStack = await miniProgram.pageStack();
    expect(pageStack.length).toBe(1);
  });
});

describe('[Reviewer] 大数据渲染压力测试', () => {
  test('大量banner数据不应导致渲染卡顿', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const largeBanners = Array.from({ length: 50 }, (_, i) => ({
      id: `banner-${i}`,
      image: '/assets/images/hero-banner-songyang.png',
      tag: 'TEST',
      title: `测试Banner ${i}`,
      description: '测试描述'.repeat(10),
      buttonText: '测试',
      priceLabel: 'FROM',
      price: `¥${i * 100}`,
    }));

    const startTime = Date.now();
    await page.setData({ banners: largeBanners });
    const renderTime = Date.now() - startTime;

    // setData应在合理时间内完成
    expect(renderTime).toBeLessThan(5000);

    const data = await page.data();
    expect(data.banners.length).toBe(50);
  });

  test('大量eggs数据渲染', async () => {
    const page = await miniProgram.currentPage();

    const largeEggs = Array.from({ length: 100 }, (_, i) => ({
      id: `egg-${i}`,
      title: `测试景点 ${i}`,
      price: '免费',
      description: '测试描述',
      duration: '1.0h',
      distance: `${i}km`,
      image: '/assets/images/yangjiatang.png',
    }));

    const startTime = Date.now();
    await page.setData({ eggs: largeEggs });
    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(5000);
  });

  test('空数组setData不应报错', async () => {
    const page = await miniProgram.currentPage();

    await page.setData({
      banners: [],
      journeys: [],
      inspirationCards: [],
      eggs: [],
      foods: [],
      hasJourneys: false,
    });

    const data = await page.data();
    expect(data.banners.length).toBe(0);
    expect(data.hasJourneys).toBe(false);
  });
});

describe('[Reviewer] 快速操作竞态验证', () => {
  test('快速切换Tab不应导致页面错乱', async () => {
    await miniProgram.reLaunch(PAGES.INDEX);
    await new Promise((r) => setTimeout(r, 500));

    // 快速切换
    miniProgram.switchTab(PAGES.TREASURE);
    miniProgram.switchTab(PAGES.MINE);
    miniProgram.switchTab(PAGES.INDEX);
    await miniProgram.switchTab(PAGES.MINE);
    await new Promise((r) => setTimeout(r, TIMEOUTS.PAGE_LOAD));

    const page = await miniProgram.currentPage();
    expect(page.path).toBe('pages/mine/index');
  });

  test('页面数据并发setData不应丢失', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    // 并发设置不同字段
    await Promise.all([
      page.setData({ 'userInfo.nickName': '并发测试1' }),
      page.setData({ hasJourneys: false }),
      page.setData({ inspirationTitle: '并发标题' }),
    ]);

    await page.waitFor(TIMEOUTS.TAP_DELAY);
    const data = await page.data();

    // 所有字段都应该被正确设置
    expect(data.hasJourneys).toBe(false);
    expect(data.inspirationTitle).toBe('并发标题');
  });
});

describe('[Reviewer] 页面生命周期验证', () => {
  test('页面隐藏再显示时数据应保持', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const dataBefore = await page.data();

    // 跳转到其他页面再返回
    await miniProgram.navigateTo(PAGES.SURVEY);
    await new Promise((r) => setTimeout(r, 500));
    await miniProgram.navigateBack();
    await new Promise((r) => setTimeout(r, 500));

    const dataAfter = await page.data();
    expect(dataAfter.banners.length).toBe(dataBefore.banners.length);
  });

  test('switchTab后onShow应被触发', async () => {
    await miniProgram.switchTab(PAGES.MINE);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    // onShow中会调用loadUserInfo，验证数据已加载
    const data = await page.data();
    expect(data.userInfo).toBeDefined();
  });
});

describe('[Reviewer] 异常输入验证', () => {
  test('问卷选择无效ID不应崩溃', async () => {
    await miniProgram.navigateTo(PAGES.SURVEY);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    // 传入不存在的ID
    await page.callMethod('onSelectIntensity', {
      currentTarget: { dataset: { id: 'nonexistent_id' } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    // 不应崩溃，值会被设置为传入的值
    expect(data.selectedIntensity).toBe('nonexistent_id');
  });

  test('问卷选择undefined不应崩溃', async () => {
    const page = await miniProgram.currentPage();

    await page.callMethod('onSelectFood', {
      currentTarget: { dataset: { id: undefined } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    // 页面不应崩溃
    const data = await page.data();
    expect(data).toBeDefined();
  });

  test('setData传入超长字符串不应崩溃', async () => {
    const page = await miniProgram.currentPage();
    const longString = 'A'.repeat(10000);

    await page.setData({ selectedIntensity: longString });
    const data = await page.data();
    expect(data.selectedIntensity.length).toBe(10000);
  });
});
