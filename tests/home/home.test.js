const automator = require('miniprogram-automator');
const { AUTOMATOR_CONFIG, PAGES, TIMEOUTS } = require('../shared/config');

/**
 * 首页 (pages/index) e2e 自动化测试 —— 对齐真实 per-domain 接口（非 /home/* 聚合）。
 *
 * 用 mockWxMethod('request', fn) 注入按 url 分流的请求 mock，真实走通
 * services + pages/index/index.ts 的 home-mappers 映射逻辑。
 *
 * 覆盖接口：
 *   /wx/template/list      banner + 搜索（最新5 / 关键词）
 *   /wx/itinerary/list     我的寻觅之旅（返回 daysList，前端算当天目标/影像/酒店/餐厅）
 *   /wx/attraction/list    探索秘境（经典景点）
 *   /wx/checkin/list       隐匿之藏（经典打卡点）
 *   /wx/dish/featured      地道风物（各餐厅特色菜）
 *   /wx/dish/list          餐厅特色菜首图
 *   /wx/attraction/:id     景点详情（点击非盲卡片开抽屉）
 */

const EXPECT = {
  bannerCount: 5, // mock 返回 6 个模板，前端截取最新 5 个作 banner
  secretCount: 2, // 探索秘境已过滤盲游景点，仅剩 2 个非盲
  hiddenCount: 3,
  foodCount: 4,
  latestCount: 5,
  searchKeyword: '梯田',
  districtName: '松阳县',
  goalTitle: '当天 2 个景点 · 约 3 小时',
  hotelName: '云端隐庐',
  restaurantName: '山野食集',
};

function homeRequestMock(options) {
  var url = (options && options.url) || '';
  var data = (options && options.data) || {};
  var IMG = 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/hero-banner-songyang.png';
  function ajax(payload) {
    return { data: { code: 200, msg: 'ok', data: payload }, statusCode: 200 };
  }
  function table(rows) {
    return { data: { code: 200, msg: 'ok', rows: rows, total: rows.length }, statusCode: 200 };
  }

  // 模板列表（banner + 搜索）
  if (url.indexOf('/wx/template/list') >= 0) {
    if (data.keyword) {
      return ajax([
        { templateId: 901, templateName: data.keyword + '·云上秘境', price: 1999, coverImage: IMG, districtName: '云和县' },
      ]);
    }
    var tpls = [];
    for (var i = 1; i <= 6; i++) {
      tpls.push({ templateId: 100 + i, templateName: '最新线路 ' + i, price: 1000 + i, coverImage: IMG, districtName: '松阳县' });
    }
    return ajax(tpls);
  }

  // 添加景点到某天（POST）—— 记录被调用的 url 供断言
  if (url.indexOf('/wx/itinerary/') >= 0 && url.indexOf('/attractions') >= 0) {
    try { globalThis.__lastAddUrl = url; } catch (e) {}
    return ajax(1);
  }

  // 行程列表（返回 daysList）
  if (url.indexOf('/wx/itinerary/list') >= 0) {
    return ajax([
      {
        itineraryId: 5001,
        itineraryName: '松阳盲游',
        district: '331124',
        districtName: '松阳县',
        startDate: '2026-07-01',
        days: 2,
        totalCost: 2499,
        blindMode: '0',
        daysList: [
          {
            dayNumber: 1,
            attractionList: [
              { attractionId: 301, attractionName: '杨家堂', visitDuration: '2小时', blindStatus: '0', attachments: [{ url: IMG }] },
              { attractionId: 302, attractionName: '', visitDuration: '1小时', blindStatus: '1' },
            ],
            accommodation: { accommodationId: 11, accommodationName: '云端隐庐', attachments: [{ url: IMG }] },
            breakfast: { diningId: 22, diningName: '山野食集', attachments: [{ url: IMG }] },
          },
          { dayNumber: 2, attractionList: [] },
        ],
      },
    ]);
  }

  // 探索秘境（经典景点）—— 前端用 blindStatus='0' 过滤盲游，mock 照此模拟
  if (url.indexOf('/wx/attraction/list') >= 0) {
    var all = [
      { attractionId: 301, attractionName: '隐潭飞瀑', classicRating: '4.8', blindStatus: '0', attachments: [{ url: IMG }] },
      { attractionId: 302, attractionName: '古道石桥', classicRating: '4.5', blindStatus: '0', attachments: [{ url: IMG }] },
      { attractionId: 303, attractionName: '暗夜秘境', classicRating: '4.6', blindStatus: '1', attachments: [{ url: IMG }] },
    ];
    var rows = data.blindStatus === '0' ? all.filter(function (a) { return a.blindStatus === '0'; }) : all;
    return table(rows);
  }

  // 隐匿之藏（经典打卡点）—— 前端用 blindStatus='0' 过滤盲游
  if (url.indexOf('/wx/checkin/list') >= 0) {
    var allc = [
      { checkinId: 401, checkinName: '溪畔听风亭', classicRating: '4.7', blindStatus: '0', attachments: [{ url: IMG }] },
      { checkinId: 402, checkinName: '崖顶观星台', classicRating: '4.9', blindStatus: '0', attachments: [{ url: IMG }] },
      { checkinId: 403, checkinName: '林间秋千', classicRating: '4.3', blindStatus: '0', attachments: [{ url: IMG }] },
      { checkinId: 404, checkinName: '暗夜打卡点', classicRating: '4.6', blindStatus: '1', attachments: [{ url: IMG }] },
    ];
    var crows = data.blindStatus === '0' ? allc.filter(function (c) { return c.blindStatus === '0'; }) : allc;
    return table(crows);
  }

  // 地道风物
  if (url.indexOf('/wx/dish/featured') >= 0) {
    return ajax([
      { dishId: 501, diningId: 22, diningName: '山野食集', dishName: '土窑鸡', image: IMG, specialStar: 5 },
      { dishId: 502, diningId: 22, diningName: '山野食集', dishName: '溪鱼汤', image: IMG, specialStar: 4 },
      { dishId: 503, diningId: 23, diningName: '云上小馆', dishName: '野菜饼', image: IMG, specialStar: 3 },
      { dishId: 504, diningId: 23, diningName: '云上小馆', dishName: '笋干煲', image: IMG, specialStar: 2 },
    ]);
  }

  // 餐厅特色菜首图
  if (url.indexOf('/wx/dish/list') >= 0) {
    return ajax([{ dishId: 501, dishName: '土窑鸡', attachments: [{ url: IMG }] }]);
  }

  // 景点详情
  if (url.indexOf('/wx/attraction/') >= 0) {
    return ajax({
      attractionId: 301,
      attractionName: '隐潭飞瀑',
      attractionDescription: '藏于峡谷深处的三叠瀑布。',
      classicRating: '4.8',
      attachments: [{ url: IMG }],
    });
  }

  return ajax(null);
}

describe('首页 pages/index 自动化测试（真实接口）', () => {
  let miniProgram;
  let page;

  beforeAll(async () => {
    miniProgram = await automator.launch(AUTOMATOR_CONFIG);
    // 清空「当地」缓存，保证跨轮次断言确定性
    await miniProgram.evaluate(() => {
      try { wx.clearStorageSync(); } catch (e) {}
    });
    await miniProgram.mockWxMethod('request', homeRequestMock);
    page = await miniProgram.reLaunch(PAGES.INDEX);
    await page.waitFor(TIMEOUTS.NETWORK);
  }, 60000);

  afterAll(async () => {
    if (miniProgram) {
      // 清理测试写入的 district-cache，避免污染开发者工具项目 storage
      try {
        await miniProgram.evaluate(() => {
          try { wx.clearStorageSync(); } catch (e) {}
        });
      } catch (e) {}
      await miniProgram.restoreWxMethod('request');
      await miniProgram.close();
    }
  });

  test('banner 由模板列表渲染并截取最新5个', async () => {
    const data = await page.data();
    expect(data.banners.length).toBe(EXPECT.bannerCount);
  });

  test('当地跟随行程 district 显示区县名', async () => {
    const localText = await page.$('.local-bar-text');
    expect(await localText.text()).toContain(EXPECT.districtName);
  });

  test('寻觅之旅主卡：当天目标 / 酒店 / 餐厅 / 盲游遮罩', async () => {
    // 自定义组件内节点需先取组件元素再查询
    const jc = await page.$('journey-card');
    expect(jc).not.toBeNull();
    const goal = await jc.$('.goal-title');
    expect(await goal.text()).toBe(EXPECT.goalTitle);

    const hotelName = await jc.$('.corner-hotel .corner-name');
    expect(await hotelName.text()).toBe(EXPECT.hotelName);
    const diningName = await jc.$('.corner-dining .corner-name');
    expect(await diningName.text()).toBe(EXPECT.restaurantName);

    // 盲游景点影像遮罩
    const veils = await jc.$$('.blur-veil-text');
    expect(veils.length).toBeGreaterThanOrEqual(1);
  });

  test('三大发现渲染正确数量', async () => {
    const ic = await page.$('inspiration-card');
    const inspiration = await ic.$$('.inspiration-card');
    expect(inspiration.length).toBe(EXPECT.secretCount);
    // gem-item / food-card 以 wx:for 在页面级渲染多个组件实例
    const gems = await page.$$('gem-item');
    expect(gems.length).toBe(EXPECT.hiddenCount);
    const foods = await page.$$('food-card');
    expect(foods.length).toBe(EXPECT.foodCount);
  });

  test('点击非盲景点打开介绍抽屉', async () => {
    await page.callMethod('onIntroClose');
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    const ic = await page.$('inspiration-card');
    const cards = await ic.$$('.inspiration-card');
    await cards[0].tap();
    await page.waitFor(TIMEOUTS.ANIMATION);
    const data = await page.data();
    expect(data.showIntroDrawer).toBe('attraction');
  });

  test('探索秘境不含盲游景点（接口 blindStatus=0 过滤）', async () => {
    const ic = await page.$('inspiration-card');
    const cards = await ic.$$('.inspiration-card');
    expect(cards.length).toBe(EXPECT.secretCount); // 盲游项已被接口过滤
    const data = await page.data();
    const hasBlurred = (data.inspirationCards || []).some((c) => c.blurred);
    expect(hasBlurred).toBe(false);
  });

  test('添加到行程：有行程时可选择行程与天数并成功添加', async () => {
    await page.callMethod('onIntroClose');
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    // 打开一个非盲景点抽屉（设置 introContext）
    const ic = await page.$('inspiration-card');
    const cards = await ic.$$('.inspiration-card');
    await cards[0].tap();
    await page.waitFor(TIMEOUTS.ANIMATION);
    // 触发「添加到行程」
    await page.callMethod('onAddToItinerary');
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    let data = await page.data();
    expect(data.addFlow.visible).toBe(true);
    expect(data.addFlow.step).toBe('itinerary');
    expect(data.addFlow.itineraries.length).toBe(1);
    // 选择行程 → 进入选天
    let items = await page.$$('.addflow-item');
    await items[0].tap();
    await page.waitFor(TIMEOUTS.TAP_DELAY);
    data = await page.data();
    expect(data.addFlow.step).toBe('day');
    expect(data.addFlow.days.length).toBe(2);
    // 清空记录器，选第1天 → 景点直接添加 → 成功后面板关闭
    await miniProgram.evaluate(() => { try { globalThis.__lastAddUrl = ''; } catch (e) {} });
    items = await page.$$('.addflow-item');
    await items[0].tap();
    await page.waitFor(TIMEOUTS.NETWORK);
    data = await page.data();
    expect(data.addFlow.visible).toBe(false);
    // 断言真正发起了"加入第1天景点"的请求（景点 301 → day 1）
    const addUrl = await miniProgram.evaluate(() => globalThis.__lastAddUrl || '');
    expect(addUrl).toContain('/day/1/attractions');
  });

  test('搜索：默认最新5，输入关键词防抖后返回结果', async () => {
    const entry = await page.$('.top-bar-search');
    await entry.tap();
    await page.waitFor(TIMEOUTS.NETWORK);

    let data = await page.data();
    expect(data.searchActive).toBe(true);
    expect(data.searchResults.length).toBe(EXPECT.latestCount);
    let hint = await page.$('.search-hint');
    expect(await hint.text()).toBe('最新上线');

    const input = await page.$('.search-input');
    await input.input(EXPECT.searchKeyword);
    await page.waitFor(500); // 覆盖 300ms 防抖

    data = await page.data();
    expect(data.searchKeyword).toBe(EXPECT.searchKeyword);
    expect(data.searchResults.length).toBe(1);
    expect(data.searchResults[0].title).toContain(EXPECT.searchKeyword);
    hint = await page.$('.search-hint');
    expect(await hint.text()).toBe('搜索结果');

    await page.callMethod('onSearchClose');
    await page.waitFor(TIMEOUTS.TAP_DELAY);
  });
});
