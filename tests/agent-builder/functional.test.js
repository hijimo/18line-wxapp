/**
 * Agent Builder - 功能验证Agent
 *
 * 职责：编写正向测试用例，验证所有功能按预期工作。
 * 策略：模拟正常用户操作路径，验证 happy path。
 * 立场：乐观派 —— 证明功能是正确的。
 */
const automator = require('miniprogram-automator');
const { AUTOMATOR_CONFIG, PAGES, TIMEOUTS } = require('../shared/config');
const { mockLogin, takeScreenshot } = require('../shared/automator-helper');

let miniProgram;

beforeAll(async () => {
  miniProgram = await automator.launch(AUTOMATOR_CONFIG);
  await mockLogin(miniProgram);
}, 60000);

afterAll(async () => {
  if (miniProgram) await miniProgram.close();
});

describe('[Builder] 登录流程验证', () => {
  test('登录页面正确渲染', async () => {
    const page = await miniProgram.reLaunch(PAGES.LOGIN);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const brandName = await page.$('.brand-name');
    expect(brandName).not.toBeNull();
    const text = await brandName.text();
    expect(text).toBe('18线');

    const loginBtn = await page.$('.login-btn');
    expect(loginBtn).not.toBeNull();
  });

  test('协议勾选状态切换', async () => {
    const page = await miniProgram.currentPage();
    const checkbox = await page.$('.checkbox-container');
    await checkbox.tap();
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.agreed).toBe(true);

    await checkbox.tap();
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    const data2 = await page.data();
    expect(data2.agreed).toBe(false);
  });

  test('未勾选协议时点击登录应提示', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({ agreed: false });

    const loginBtn = await page.$('.login-btn');
    await loginBtn.tap();
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.loading).toBe(false);
  });

  test('勾选协议后可正常触发登录', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({ agreed: true, code: 'mock_code' });

    await miniProgram.mockWxMethod('request', {
      data: { code: 200, data: { token: 'test_token_123' }, msg: 'ok' },
      statusCode: 200,
    });

    const loginBtn = await page.$('.login-btn');
    await loginBtn.tap();
    await page.waitFor(TIMEOUTS.NETWORK);

    await miniProgram.restoreWxMethod('request');
  });
});

describe('[Builder] 首页功能验证', () => {
  beforeAll(async () => {
    await mockLogin(miniProgram);
    await miniProgram.reLaunch(PAGES.INDEX);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
  });

  test('首页正确渲染导航栏', async () => {
    const page = await miniProgram.currentPage();
    const navBar = await page.$('navigation-bar');
    expect(navBar).not.toBeNull();
  });

  test('Banner轮播图正确展示', async () => {
    const page = await miniProgram.currentPage();
    const heroBanner = await page.$('hero-banner');
    expect(heroBanner).not.toBeNull();

    const data = await page.data();
    expect(data.banners).toBeDefined();
    expect(data.banners.length).toBeGreaterThan(0);
  });

  test('旅程卡片区域正确展示', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();

    if (data.hasJourneys) {
      const journeyCard = await page.$('journey-card');
      expect(journeyCard).not.toBeNull();
    } else {
      const emptyCard = await page.$('.journey-empty-card');
      expect(emptyCard).not.toBeNull();
    }
  });

  test('灵感卡片区域正确展示', async () => {
    const page = await miniProgram.currentPage();
    const inspirationCard = await page.$('inspiration-card');
    expect(inspirationCard).not.toBeNull();
  });

  test('Easter Eggs列表正确展示', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.eggs).toBeDefined();
    expect(data.eggs.length).toBeGreaterThan(0);

    const gemItems = await page.$$('gem-item');
    expect(gemItems.length).toBe(data.eggs.length);
  });

  test('美食列表正确展示', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.foods).toBeDefined();

    const foodCards = await page.$$('food-card');
    expect(foodCards.length).toBe(data.foods.length);
  });

  test('点击"全部轨迹"跳转到旅程列表', async () => {
    const page = await miniProgram.currentPage();
    const viewAll = await page.$('.journey-view-all');
    await viewAll.tap();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/journeys/index');

    await miniProgram.navigateBack();
    await page.waitFor(TIMEOUTS.TAP_DELAY);
  });
});

describe('[Builder] TabBar导航验证', () => {
  test('切换到集市Tab', async () => {
    await miniProgram.switchTab(PAGES.TREASURE);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
    expect(page.path).toBe('pages/treasure/index');
  });

  test('切换到我的Tab', async () => {
    await miniProgram.switchTab(PAGES.MINE);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
    expect(page.path).toBe('pages/mine/index');
  });

  test('切换回探索Tab', async () => {
    await miniProgram.switchTab(PAGES.INDEX);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
    expect(page.path).toBe('pages/index/index');
  });
});

describe('[Builder] 问卷调查流程验证', () => {
  beforeAll(async () => {
    await miniProgram.navigateTo(PAGES.SURVEY);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
  });

  test('问卷第一步：体力选择正确渲染', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.currentStep).toBe(1);
    expect(data.intensityOptions.length).toBe(4);
    expect(data.selectedIntensity).toBe('steady');
  });

  test('可以选择不同体力等级', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onSelectIntensity', {
      currentTarget: { dataset: { id: 'extreme' } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.selectedIntensity).toBe('extreme');
  });

  test('点击下一步进入第二步', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onNext');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.currentStep).toBe(2);
  });

  test('问卷第二步：饮食和住宿选择', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.foodOptions.length).toBe(4);
    expect(data.accomOptions.length).toBe(4);
  });

  test('点击下一步进入第三步', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onNext');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.currentStep).toBe(3);
  });

  test('问卷第三步：旅行灵魂多选', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onSelectSoul', {
      currentTarget: { dataset: { id: 'lens' } },
    });
    await page.callMethod('onSelectSoul', {
      currentTarget: { dataset: { id: 'nature' } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.selectedSoul).toContain('lens');
    expect(data.selectedSoul).toContain('nature');
  });

  test('可以取消已选择的灵魂标签', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onSelectSoul', {
      currentTarget: { dataset: { id: 'lens' } },
    });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.selectedSoul).not.toContain('lens');
    expect(data.selectedSoul).toContain('nature');
  });

  test('返回上一步功能正常', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('onBack');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.currentStep).toBe(2);
  });
});

describe('[Builder] 个人中心验证', () => {
  beforeAll(async () => {
    await miniProgram.switchTab(PAGES.MINE);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
  });

  test('用户信息正确展示', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.userInfo).toBeDefined();
    expect(data.userInfo.nickname).toBeDefined();
    expect(data.userInfo.avatarUrl).toBeDefined();
  });

  test('旅程统计数据展示', async () => {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    expect(data.journeyCount).toBeDefined();
    expect(data.journeyCount.pending).toBeDefined();
  });

  test('编辑资料入口可点击', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('goEditProfile');
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/profile-edit/index');

    await miniProgram.navigateBack();
    await page.waitFor(TIMEOUTS.TAP_DELAY);
  });

  test('旅行特质入口可点击', async () => {
    const page = await miniProgram.currentPage();
    await page.callMethod('goTravelTraits');
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/survey/index');

    await miniProgram.navigateBack();
    await page.waitFor(TIMEOUTS.TAP_DELAY);
  });
});
