const fs = require('fs');
const {
  AUTH_STATE_PATH,
  getRecordedRequests,
  installE2eMocks,
  launchMiniProgram,
  restoreE2eMocks,
  runLoginSetup,
  TEST_TOKEN,
} = require('../shared/app');

describe('auth/setup 登录态建立', () => {
  let miniProgram;

  beforeAll(async () => {
    miniProgram = await launchMiniProgram();
    await installE2eMocks(miniProgram);
  }, 60000);

  afterAll(async () => {
    if (miniProgram) {
      await restoreE2eMocks(miniProgram);
      await miniProgram.close();
    }
  });

  test('用户同意协议后完成登录并保存可复用 token', async () => {
    const token = await runLoginSetup(miniProgram);
    expect(token).toBe(TEST_TOKEN);
    expect(fs.existsSync(AUTH_STATE_PATH)).toBe(true);

    const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf8'));
    expect(state.token).toBe(TEST_TOKEN);

    const requests = await getRecordedRequests(miniProgram);
    expect(requests.some((req) => req.url.indexOf('/wx/auth/login') >= 0)).toBe(true);
  });
});
