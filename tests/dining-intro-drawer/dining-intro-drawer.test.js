const automator = require('miniprogram-automator');
const { AUTOMATOR_CONFIG, PAGES, TIMEOUTS } = require('../shared/config');

const mockDining = {
  diningId: 18,
  diningName: '山野晨食馆',
  diningDesc:
    '靠近溪谷的早餐小馆，主打手作米糕、土鸡汤和当季野菜，适合作为上午出发前的补给点。',
  diningTips: '建议 08:30 前到店，窗边座位视野最好。雨天可提前电话确认营业时间。',
  avgCost: 68,
  recommendRating: 4.8,
  parkingAvailable: 'Y',
  petFriendly: 'Y',
  diningNature: '本地风味',
  address: '浙江省丽水市莲都区山谷路 18 号',
  attachments: [
    {
      url: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/miniprogram/assets/images/dining-breakfast.png',
    },
    {
      url: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/miniprogram/assets/images/dining-side.png',
    },
    {
      url: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/miniprogram/assets/images/dining-room.png',
    },
  ],
};

async function openDiningDrawer(page) {
  await page.setData({
    loading: false,
    showAddDrawer: false,
    showIntroDrawer: 'dining',
    introData: mockDining,
    itinerary: {
      itineraryId: 1,
      itineraryName: '18 线周末',
      days: 1,
      daysList: [],
      dateRangeText: '5月24日',
    },
  });
  await page.waitFor(TIMEOUTS.ANIMATION);
}

async function getDiningDrawer(page) {
  const drawer = await page.$('dining-intro-drawer');
  expect(drawer).not.toBeNull();
  return drawer;
}

describe('dining-intro-drawer 自动化交互', () => {
  let miniProgram;
  let page;

  beforeAll(async () => {
    miniProgram = await automator.launch(AUTOMATOR_CONFIG);
    await miniProgram.mockWxMethod('request', {
      data: { code: 200, data: null, msg: 'ok' },
      statusCode: 200,
    });
    page = await miniProgram.reLaunch(`${PAGES.ITINERARY_DETAIL}?id=1`);
    await page.waitFor(TIMEOUTS.PAGE_LOAD);
  }, 60000);

  afterAll(async () => {
    if (miniProgram) {
      await miniProgram.restoreWxMethod('request');
      await miniProgram.close();
    }
  });

  test('展示餐厅信息、标签、地址和底部操作区', async () => {
    await openDiningDrawer(page);
    const drawer = await getDiningDrawer(page);

    const title = await drawer.$('.dining-drawer-title');
    expect(await title.text()).toBe(mockDining.diningName);

    const heroImage = await drawer.$('.dining-hero-main');
    const metaTags = await drawer.$$('.dining-meta-chip');
    const footer = await drawer.$('.dining-drawer-footer');

    expect(heroImage).not.toBeNull();
    expect(metaTags.length).toBeGreaterThanOrEqual(4);
    expect(footer).not.toBeNull();
  });

  test('点击关闭按钮会关闭抽屉并清空 introData', async () => {
    await openDiningDrawer(page);
    const drawer = await getDiningDrawer(page);
    const closeButton = await drawer.$('.dining-drawer-close');

    await closeButton.tap();
    await page.waitFor(TIMEOUTS.ANIMATION);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('');
    expect(data.introData).toBeNull();
  });

  test('点击遮罩会关闭抽屉', async () => {
    await openDiningDrawer(page);
    const drawer = await getDiningDrawer(page);
    const baseDrawer = await drawer.$('base-drawer');
    const mask = await baseDrawer.$('.drawer-mask');

    await mask.tap();
    await page.waitFor(TIMEOUTS.ANIMATION);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('');
  });

  test('点击主按钮会触发关键操作并关闭抽屉', async () => {
    await openDiningDrawer(page);
    const drawer = await getDiningDrawer(page);
    const primaryButton = await drawer.$('.dining-primary-action');

    await primaryButton.tap();
    await page.waitFor(TIMEOUTS.ANIMATION);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('');
  });
});
