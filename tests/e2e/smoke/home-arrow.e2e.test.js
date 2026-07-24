const fs = require('fs');
const path = require('path');

const {
  ensureAuthenticated,
  installE2eMocks,
  launchMiniProgram,
  PAGES,
  restoreE2eMocks,
  TIMEOUTS,
} = require('../shared/app');

describe('smoke 首页顶栏箭头与通知入口 (需求2)', () => {
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

  test('2.1 首页显示主题色左箭头且不显示通知图标', async () => {
    const page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.NETWORK);

    const arrow = await page.$('.top-bar-arrow');
    expect(arrow).not.toBeNull();
    expect(await arrow.text()).toBe('←');

    const brand = await page.$('.top-bar-brand');
    expect(brand).not.toBeNull();
    expect(await brand.text()).toBe('寻秘');

    const bell = await page.$('.top-bar-bell');
    expect(bell).toBeNull();

    const stylePath = path.resolve(__dirname, '../../../miniprogram/pages/index/index.scss');
    const styleSource = fs.readFileSync(stylePath, 'utf8');
    expect(styleSource).toMatch(/\.top-bar-arrow\s*\{[^}]*color:\s*#163422;/s);

    // NOTE: 像素级对齐仍需微信开发者工具或真机截图验证。
  });
});
