const automator = require('miniprogram-automator');
const { AUTOMATOR_CONFIG, MOCK_USER } = require('./config');

let miniProgram = null;

async function launchApp() {
  if (miniProgram) return miniProgram;
  miniProgram = await automator.launch(AUTOMATOR_CONFIG);
  return miniProgram;
}

async function connectApp(wsEndpoint) {
  if (miniProgram) return miniProgram;
  miniProgram = await automator.connect({ wsEndpoint });
  return miniProgram;
}

async function closeApp() {
  if (miniProgram) {
    await miniProgram.close();
    miniProgram = null;
  }
}

async function getMiniProgram() {
  return miniProgram;
}

async function mockLogin(mp) {
  await mp.evaluate(() => {
    wx.setStorageSync('token', 'mock_token_for_testing_12345');
  });
}

async function clearLogin(mp) {
  await mp.evaluate(() => {
    wx.removeStorageSync('token');
  });
}

async function mockWxApi(mp, method, result) {
  await mp.mockWxMethod(method, result);
}

async function restoreWxApi(mp, method) {
  await mp.restoreWxMethod(method);
}

async function takeScreenshot(mp, name) {
  const timestamp = Date.now();
  const path = `./reports/screenshots/${name}_${timestamp}.png`;
  await mp.screenshot({ path });
  return path;
}

async function waitForPageReady(page, timeout = 3000) {
  await page.waitFor(timeout);
}

module.exports = {
  launchApp,
  connectApp,
  closeApp,
  getMiniProgram,
  mockLogin,
  clearLogin,
  mockWxApi,
  restoreWxApi,
  takeScreenshot,
  waitForPageReady,
};
