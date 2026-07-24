const fs = require('fs');
const path = require('path');
const automator = require('miniprogram-automator');
const { AUTOMATOR_CONFIG, PAGES, TIMEOUTS } = require('../../shared/config');
const { e2eRequestMock } = require('./request-mock');

const AUTH_STATE_PATH = path.resolve(__dirname, '../../.auth/login-state.json');
const TEST_TOKEN = 'e2e_token_from_login';

async function launchMiniProgram() {
  return automator.launch(AUTOMATOR_CONFIG);
}

async function installE2eMocks(miniProgram) {
  await miniProgram.evaluate(() => {
    try {
      globalThis.__e2eRequests = [];
      globalThis.__e2eToasts = [];
      globalThis.__e2eModals = [];
      globalThis.__e2eActionSheets = [];
      globalThis.__e2eModalConfirm = true;
      globalThis.__e2eActionSheetIndex = 0;
      wx.clearStorageSync();
    } catch (e) {}
  });
  await miniProgram.mockWxMethod('login', { code: 'e2e_login_code' });
  await miniProgram.mockWxMethod('request', e2eRequestMock);
  await miniProgram.mockWxMethod('showToast', function (options) {
    try {
      globalThis.__e2eToasts = globalThis.__e2eToasts || [];
      globalThis.__e2eToasts.push(options || {});
    } catch (e) {}
    if (options && typeof options.success === 'function') options.success({});
  });
  await miniProgram.mockWxMethod('showLoading', function (options) {
    if (options && typeof options.success === 'function') options.success({});
  });
  await miniProgram.mockWxMethod('hideLoading', function (options) {
    if (options && typeof options.success === 'function') options.success({});
  });
  await miniProgram.mockWxMethod('setKeepScreenOn', function (options) {
    if (options && typeof options.success === 'function') options.success({});
  });
  await miniProgram.mockWxMethod('showModal', function (options) {
    try {
      globalThis.__e2eModals = globalThis.__e2eModals || [];
      globalThis.__e2eModals.push(options || {});
    } catch (e) {}
    // Default: simulate user confirming (can be overridden per-test)
    var confirmResult = globalThis.__e2eModalConfirm !== false;
    if (options && typeof options.success === 'function') {
      options.success({ confirm: confirmResult, cancel: !confirmResult });
    }
  });
  await miniProgram.mockWxMethod('showActionSheet', function (options) {
    try {
      globalThis.__e2eActionSheets = globalThis.__e2eActionSheets || [];
      globalThis.__e2eActionSheets.push(options || {});
    } catch (e) {}
    // Default: select first item (tapIndex: 0)
    var tapIdx = globalThis.__e2eActionSheetIndex !== undefined ? globalThis.__e2eActionSheetIndex : 0;
    if (options && typeof options.success === 'function') {
      options.success({ tapIndex: tapIdx });
    }
  });
}

async function restoreE2eMocks(miniProgram) {
  for (const method of ['showActionSheet', 'showModal', 'setKeepScreenOn', 'hideLoading', 'showLoading', 'showToast', 'request', 'login']) {
    try {
      await miniProgram.restoreWxMethod(method);
    } catch (e) {}
  }
}

function readAuthState() {
  try {
    return JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeAuthState(state) {
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(state, null, 2));
}

async function runLoginSetup(miniProgram) {
  const page = await miniProgram.reLaunch(PAGES.LOGIN);
  await page.waitFor(TIMEOUTS.PAGE_LOAD);

  const brand = await page.$('.brand-name');
  expect(brand).not.toBeNull();
  expect(await brand.text()).toBe('18线');

  const loginButton = await page.$('.login-btn');
  const checkbox = await page.$('.checkbox-container');
  expect(loginButton).not.toBeNull();
  expect(checkbox).not.toBeNull();

  await page.setData({ code: 'e2e_login_code' });
  await checkbox.tap();
  await page.waitFor(TIMEOUTS.TAP_DELAY);
  await loginButton.tap();
  await page.waitFor(TIMEOUTS.NETWORK);

  const token = await miniProgram.evaluate(() => wx.getStorageSync('token'));
  expect(token).toBe(TEST_TOKEN);

  writeAuthState({
    token,
    generatedAt: new Date().toISOString(),
    source: 'auth/setup.e2e.test.js',
  });

  return token;
}

async function ensureAuthenticated(miniProgram) {
  const state = readAuthState();
  if (!state || state.token !== TEST_TOKEN) {
    return runLoginSetup(miniProgram);
  }

  const storedToken = await miniProgram.evaluate(() => wx.getStorageSync('token'));
  if (storedToken !== state.token) {
    await miniProgram.evaluate((token) => {
      wx.setStorageSync('token', token);
    }, state.token);
  }

  const finalToken = await miniProgram.evaluate(() => wx.getStorageSync('token'));
  if (finalToken !== state.token) {
    return runLoginSetup(miniProgram);
  }
  return state.token;
}

async function getRecordedRequests(miniProgram) {
  return miniProgram.evaluate(() => globalThis.__e2eRequests || []);
}

async function getRecordedToasts(miniProgram) {
  return miniProgram.evaluate(() => globalThis.__e2eToasts || []);
}

async function getRecordedModals(miniProgram) {
  return miniProgram.evaluate(() => globalThis.__e2eModals || []);
}

async function getRecordedActionSheets(miniProgram) {
  return miniProgram.evaluate(() => globalThis.__e2eActionSheets || []);
}

async function resetRecordedEvents(miniProgram) {
  await miniProgram.evaluate(() => {
    globalThis.__e2eRequests = [];
    globalThis.__e2eToasts = [];
    globalThis.__e2eModals = [];
    globalThis.__e2eActionSheets = [];
  });
}

async function setModalConfirm(miniProgram, confirm) {
  await miniProgram.evaluate((val) => {
    globalThis.__e2eModalConfirm = val;
  }, confirm);
}

async function setActionSheetIndex(miniProgram, index) {
  await miniProgram.evaluate((val) => {
    globalThis.__e2eActionSheetIndex = val;
  }, index);
}

module.exports = {
  AUTH_STATE_PATH,
  PAGES,
  TIMEOUTS,
  TEST_TOKEN,
  ensureAuthenticated,
  getRecordedActionSheets,
  getRecordedModals,
  getRecordedRequests,
  getRecordedToasts,
  installE2eMocks,
  launchMiniProgram,
  readAuthState,
  resetRecordedEvents,
  restoreE2eMocks,
  runLoginSetup,
  setActionSheetIndex,
  setModalConfirm,
};
