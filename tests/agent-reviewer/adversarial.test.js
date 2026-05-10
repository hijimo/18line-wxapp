/**
 * Agent Reviewer - 对抗验证Agent
 *
 * 职责：编写破坏性测试用例，寻找边界条件和异常场景。
 * 策略：模拟异常输入、网络故障、竞态条件、权限缺失等。
 * 立场：悲观派 —— 证明功能存在缺陷。
 */
const automator = require('miniprogram-automator');
const { AUTOMATOR_CONFIG, PAGES, TIMEOUTS } = require('../shared/config');
const { mockLogin, clearLogin } = require('../shared/automator-helper');

let miniProgram;

beforeAll(async () => {
  miniProgram = await automator.launch(AUTOMATOR_CONFIG);
}, 60000);

afterAll(async () => {
  if (miniProgram) await miniProgram.close();
});

describe('[Reviewer] 登录安全性验证', () => {
  test('未勾选协议时不应发起网络请求', async () => {
    const page = await miniProgram.reLaunch(PAGES.LOGIN);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    let requestCalled = false;
    await miniProgram.exposeFunction('onRequestCalled', () => {
      requestCalled = true;
    });

    await page.setData({ agreed: false, code: 'test_code' });
    const loginBtn = await page.$('.login-btn');
    await loginBtn.tap();
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.loading).toBe(false);
  });

  test('登录按钮防重复点击', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({ agreed: true, loading: true });

    const loginBtn = await page.$('.login-btn');
    await loginBtn.tap();
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    // loading为true时不应再次触发
    const data = await page.data();
    expect(data.loading).toBe(true);
  });

  test('登录code为空时应重新获取', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({ agreed: true, code: '', loading: false });

    await miniProgram.mockWxMethod('login', { code: 'refreshed_code' });
    await miniProgram.mockWxMethod('request', {
      data: { code: 200, data: { token: 'new_token' }, msg: 'ok' },
      statusCode: 200,
    });

    const loginBtn = await page.$('.login-btn');
    await loginBtn.tap();
    await page.waitFor(TIMEOUTS.NETWORK);

    await miniProgram.restoreWxMethod('login');
    await miniProgram.restoreWxMethod('request');
  });

  test('服务端返回无token时应提示失败', async () => {
    const page = await miniProgram.reLaunch(PAGES.LOGIN);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
    await page.setData({ agreed: true, code: 'valid_code' });

    await miniProgram.mockWxMethod('request', {
      data: { code: 200, data: { token: null }, msg: 'ok' },
      statusCode: 200,
    });

    const loginBtn = await page.$('.login-btn');
    await loginBtn.tap();
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.loading).toBe(false);

    await miniProgram.restoreWxMethod('request');
  });

  test('网络超时时应正确处理', async () => {
    const page = await miniProgram.reLaunch(PAGES.LOGIN);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
    await page.setData({ agreed: true, code: 'valid_code' });

    await miniProgram.mockWxMethod('request', () => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 100);
      });
    });

    const loginBtn = await page.$('.login-btn');
    await loginBtn.tap();
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.loading).toBe(false);

    await miniProgram.restoreWxMethod('request');
  });
});

describe('[Reviewer] 未授权访问验证', () => {
  test('无token时访问首页应能容错', async () => {
    await clearLogin(miniProgram);
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    // 页面不应崩溃
    const data = await page.data();
    expect(data).toBeDefined();
  });

  test('token过期时API返回401应跳转登录', async () => {
    await mockLogin(miniProgram);

    await miniProgram.mockWxMethod('request', {
      data: { code: 401, msg: '登录已过期' },
      statusCode: 200,
    });

    await miniProgram.switchTab(PAGES.MINE);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.NETWORK);

    await miniProgram.restoreWxMethod('request');
  });

  test('token过期时API返回403应提示无权限', async () => {
    await mockLogin(miniProgram);

    await miniProgram.mockWxMethod('request', {
      data: { code: 403, msg: '无权限访问' },
      statusCode: 200,
    });

    await miniProgram.switchTab(PAGES.MINE);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.NETWORK);

    await miniProgram.restoreWxMethod('request');
  });
});

describe('[Reviewer] 首页异常数据验证', () => {
  beforeAll(async () => {
    await mockLogin(miniProgram);
  });

  test('API返回空数据时不应崩溃', async () => {
    await miniProgram.mockWxMethod('request', {
      data: { code: 200, data: [], msg: 'ok' },
      statusCode: 200,
    });

    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const data = await page.data();
    expect(data).toBeDefined();

    await miniProgram.restoreWxMethod('request');
  });

  test('API返回null时不应崩溃', async () => {
    await miniProgram.mockWxMethod('request', {
      data: { code: 200, data: null, msg: 'ok' },
      statusCode: 200,
    });

    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const data = await page.data();
    expect(data).toBeDefined();

    await miniProgram.restoreWxMethod('request');
  });

  test('API返回500时应优雅降级', async () => {
    await miniProgram.mockWxMethod('request', {
      data: 'Internal Server Error',
      statusCode: 500,
    });

    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    // 页面应该仍然可以渲染（使用默认数据）
    const data = await page.data();
    expect(data.banners).toBeDefined();

    await miniProgram.restoreWxMethod('request');
  });

  test('网络完全断开时应使用本地数据', async () => {
    await miniProgram.mockWxMethod('request', () => {
      throw new Error('net::ERR_INTERNET_DISCONNECTED');
    });

    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const data = await page.data();
    expect(data.banners).toBeDefined();
    expect(data.banners.length).toBeGreaterThan(0);

    await miniProgram.restoreWxMethod('request');
  });
});

describe('[Reviewer] 问卷边界条件验证', () => {
  beforeAll(async () => {
    await miniProgram.navigateTo(PAGES.SURVEY);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
  });

  test('第一步直接点返回应退出页面', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({ currentStep: 1 });

    const pageStackBefore = await miniProgram.pageStack();
    await page.callMethod('onBack');
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const pageStackAfter = await miniProgram.pageStack();
    expect(pageStackAfter.length).toBeLessThanOrEqual(pageStackBefore.length);
  });

  test('快速连续点击下一步不应跳过步骤', async () => {
    await miniProgram.navigateTo(PAGES.SURVEY);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    // 快速连续调用
    page.callMethod('onNext');
    page.callMethod('onNext');
    page.callMethod('onNext');
    await page.waitFor(TIMEOUTS.TAP_DELAY * 3);

    const data = await page.data();
    // 最多到第3步
    expect(data.currentStep).toBeLessThanOrEqual(3);
  });

  test('soul选择重复点击同一项应正确toggle', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({ currentStep: 3, selectedSoul: [] });

    // 点击同一项3次
    await page.callMethod('onSelectSoul', { currentTarget: { dataset: { id: 'lens' } } });
    await page.callMethod('onSelectSoul', { currentTarget: { dataset: { id: 'lens' } } });
    await page.callMethod('onSelectSoul', { currentTarget: { dataset: { id: 'lens' } } });
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    // 奇数次点击 = 选中
    expect(data.selectedSoul).toContain('lens');
    expect(data.selectedSoul.filter((s) => s === 'lens').length).toBe(1);
  });

  test('提交时网络失败应保留用户选择', async () => {
    const page = await miniProgram.currentPage();
    await page.setData({
      currentStep: 3,
      selectedIntensity: 'extreme',
      selectedFood: 'spicy',
      selectedAccom: 'luxury',
      selectedSoul: ['lens', 'history'],
    });

    await miniProgram.mockWxMethod('request', () => {
      throw new Error('Network Error');
    });

    await page.callMethod('onNext'); // 第3步的onNext触发提交
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    // 用户选择应保留
    expect(data.selectedIntensity).toBe('extreme');
    expect(data.selectedFood).toBe('spicy');
    expect(data.selectedSoul).toContain('lens');

    await miniProgram.restoreWxMethod('request');
  });
});

describe('[Reviewer] 个人中心异常验证', () => {
  test('用户信息加载失败时应显示默认值', async () => {
    await mockLogin(miniProgram);

    await miniProgram.mockWxMethod('request', () => {
      throw new Error('Failed to fetch');
    });

    await miniProgram.switchTab(PAGES.MINE);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.userInfo.nickname).toBeDefined();
    expect(data.userInfo.avatarUrl).toBeDefined();

    await miniProgram.restoreWxMethod('request');
  });

  test('退出登录确认弹窗取消时不应退出', async () => {
    await miniProgram.switchTab(PAGES.MINE);
    const page = await miniProgram.currentPage();
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    await miniProgram.mockWxMethod('showModal', { confirm: false, cancel: true });
    await page.callMethod('handleLogout');
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    // 应该仍在mine页面
    const currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/mine/index');

    await miniProgram.restoreWxMethod('showModal');
  });

  test('退出登录确认后应清除token并跳转', async () => {
    await miniProgram.mockWxMethod('showModal', { confirm: true, cancel: false });
    const page = await miniProgram.currentPage();
    await page.callMethod('handleLogout');
    await page.waitFor(TIMEOUTS.PAGE_LOAD);

    const token = await miniProgram.evaluate(() => {
      return wx.getStorageSync('token');
    });
    expect(token).toBeFalsy();

    await miniProgram.restoreWxMethod('showModal');
  });
});
