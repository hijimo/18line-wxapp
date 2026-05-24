/**
 * hotel-intro-drawer 自动化测试
 *
 * 覆盖住宿简介抽屉的打开、关闭、遮罩关闭和核心内容展示。
 */
const automator = require('miniprogram-automator');
const { AUTOMATOR_CONFIG, PAGES, TIMEOUTS } = require('../shared/config');
const { mockLogin } = require('../shared/automator-helper');

let miniProgram;

const hotelData = {
  accommodationId: 101,
  accommodationName: '云上梯田设计民宿',
  accommodationType: '精品民宿',
  breakfastIncluded: 'Y',
  petFriendly: 'Y',
  priceMin: 580,
  priceMax: 920,
  address: '浙江省丽水市云和县崇头镇梯田景区内 18 号',
  accommodationDesc:
    '位于梯田观景带旁，步行可达日出观景台。房间保留木梁结构，配有大面积观景窗，适合家庭与朋友小住。'.repeat(4),
  attachments: [{ url: 'https://example.com/hotel-cover.jpg' }],
};

async function openHotelDrawer(page, data = hotelData) {
  await page.callMethod('onCardDetail', {
    detail: { type: 'hotel', data },
  });
  await page.waitFor(TIMEOUTS.TAP_DELAY);
}

beforeAll(async () => {
  miniProgram = await automator.launch(AUTOMATOR_CONFIG);
  await mockLogin(miniProgram);

  await miniProgram.mockWxMethod('request', {
    data: {
      code: 200,
      data: {
        itineraryId: 1,
        itineraryName: '住宿抽屉测试行程',
        province: '浙江省',
        city: '丽水市',
        startDate: '2026-06-01',
        days: 1,
        status: '0',
        daysList: [
          {
            itineraryDayId: 1,
            dayNumber: 1,
            dayTheme: '梯田慢住',
            attractionList: [],
            breakfast: null,
            lunch: null,
            dinner: null,
            accommodation: hotelData,
            photography: null,
            car: null,
          },
        ],
      },
      msg: 'ok',
    },
    statusCode: 200,
  });

  await miniProgram.redirectTo(PAGES.ITINERARY_DETAIL + '?id=1');
  const page = await miniProgram.currentPage();
  await page.waitFor(TIMEOUTS.NETWORK);
  await miniProgram.restoreWxMethod('request');
}, 60000);

afterAll(async () => {
  if (miniProgram) await miniProgram.close();
});

describe('[Builder] hotel-intro-drawer 展示与交互', () => {
  test('打开后展示住宿核心内容', async () => {
    const page = await miniProgram.currentPage();
    await openHotelDrawer(page);

    const data = await page.data();
    const drawer = await page.$('.hotel-intro-drawer');
    const title = await page.$('.hotel-intro-drawer__title');
    const price = await page.$('.hotel-intro-drawer__price');
    const desc = await page.$('.hotel-intro-drawer__section-content');

    expect(data.showIntroDrawer).toBe('hotel');
    expect(drawer).not.toBeNull();
    expect(title).not.toBeNull();
    expect(price).not.toBeNull();
    expect(desc).not.toBeNull();
  });

  test('点击关闭按钮关闭抽屉并清理数据', async () => {
    const page = await miniProgram.currentPage();
    const closeButton = await page.$('.hotel-intro-drawer__close');

    expect(closeButton).not.toBeNull();
    await closeButton.tap();
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('');
    expect(data.introData).toBeNull();
  });

  test('点击遮罩关闭抽屉', async () => {
    const page = await miniProgram.currentPage();
    await openHotelDrawer(page);

    const mask = await page.$('.drawer-mask');
    expect(mask).not.toBeNull();
    await mask.tap();
    await page.waitFor(TIMEOUTS.TAP_DELAY);

    const data = await page.data();
    expect(data.showIntroDrawer).toBe('');
  });

  test('缺少图片和内容时展示稳定占位', async () => {
    const page = await miniProgram.currentPage();
    await openHotelDrawer(page, {
      accommodationId: 102,
      accommodationName: '',
      attachments: [],
    });

    const title = await page.$('.hotel-intro-drawer__title');
    const imageFallback = await page.$('.hotel-intro-drawer__image-fallback');
    const empty = await page.$('.hotel-intro-drawer__empty');

    expect(title).not.toBeNull();
    expect(imageFallback).not.toBeNull();
    expect(empty).not.toBeNull();
  });
});
