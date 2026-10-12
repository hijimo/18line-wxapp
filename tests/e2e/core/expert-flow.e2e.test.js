const {
  ensureAuthenticated,
  getRecordedRequests,
  installE2eMocks,
  launchMiniProgram,
  PAGES,
  resetRecordedEvents,
  restoreE2eMocks,
  TIMEOUTS,
} = require('../shared/app');

/**
 * 达人推荐路线（E2+E3 前端）core business 用例。
 *
 * ⚠️ 后端未部署，本套件只跑微信开发者工具自动化 + request mock，
 *    验证的是**前端契约行为**：渲染、乐观更新、请求参数、路由、脱敏红线。
 *
 * 用例 3 的「遮挡态不泄漏」是本需求唯一的资金外安全红线（B8 同类问题）：
 * mock 里 day2 的 locked 项是**对抗样本**——故意带上契约规定 locked 态不下发的
 * 敏感字段（见 request-mock.js），断言前端白名单 + sanitize 兜底后，
 * 渲染视图模型与整页 data 里这 8 个字段都不存在**有效值**。
 */

/** 用户点名的 8 个敏感字段：null / undefined / 字段缺失 / 空串 / 空数组都算通过 */
const SENSITIVE_FIELDS = [
  'attractionName',
  'attractionDescription',
  'attachments',
  'longitude',
  'latitude',
  'fuzzyLongitude',
  'fuzzyLatitude',
  'fuzzyRadius',
];

/** 「有效值」判定：能还原出位置或名称内容的值才算泄漏 */
function hasEffectiveValue(value) {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return true;
}

function expectNoSensitiveLeak(item, label) {
  SENSITIVE_FIELDS.forEach((field) => {
    expect({
      field: `${label}.${field}`,
      leaked: hasEffectiveValue(item ? item[field] : undefined),
    }).toEqual({ field: `${label}.${field}`, leaked: false });
  });
}

describe('core business 达人推荐路线', () => {
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

  test('1. 达人 tab 双列瀑布流渲染：W1 分页请求 + regionName 是名称不是编码', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.reLaunch(PAGES.EXPERT);
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.loadError).toBe(false);
    expect(data.loaded).toBe(true);
    expect(data.leftCol.length + data.rightCol.length).toBe(2);
    // mock 两条路线都进列表，瀑布流按高度分列（第一条进左列）
    expect(data.leftCol[0].routeId).toBe(601);
    expect(data.leftCol[0].routeTitle).toBe('松阳古村三日慢走');
    expect(data.leftCol[0].metaText).toBe('3 天 · 8 个景点');
    // 契约 B6：regionName 必须是展示名称，绝不能是 6 位编码
    expect(data.leftCol[0].regionName).toBe('丽水市松阳县');
    expect(data.leftCol[0].regionName).not.toMatch(/^\d{6}$/);

    const requests = await getRecordedRequests(miniProgram);
    const listReq = requests.find((req) => req.url.indexOf('/wx/expert-route/list') >= 0);
    expect(listReq).toBeDefined();
    expect(listReq.data.pageNum).toBe(1);
  });

  test('2. 爱心收藏切换：乐观更新 + W3 请求体正确（收藏/取消各一次）', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.reLaunch(PAGES.EXPERT);
    await page.waitFor(TIMEOUTS.NETWORK);

    // 收藏：601 初始 favorited=false
    await page.callMethod('onFavoriteTap', { detail: { item: { routeId: 601 } } });
    await page.waitFor(TIMEOUTS.NETWORK);

    let data = await page.data();
    expect(data.leftCol[0].favorited).toBe(true);
    // mock 服务端回 13：以服务端返回为准覆盖乐观值
    expect(data.leftCol[0].favoriteCount).toBe(13);

    let requests = await getRecordedRequests(miniProgram);
    let favReq = requests.find(
      (req) => req.url.indexOf('/wx/expert-route/601/favorite') >= 0,
    );
    expect(favReq).toBeDefined();
    expect(favReq.method).toBe('POST');
    expect(favReq.data.favorited).toBe(true);

    // 取消收藏
    await resetRecordedEvents(miniProgram);
    await page.callMethod('onFavoriteTap', { detail: { item: { routeId: 601 } } });
    await page.waitFor(TIMEOUTS.NETWORK);

    data = await page.data();
    expect(data.leftCol[0].favorited).toBe(false);
    expect(data.leftCol[0].favoriteCount).toBe(11);

    requests = await getRecordedRequests(miniProgram);
    favReq = requests.find(
      (req) => req.url.indexOf('/wx/expert-route/601/favorite') >= 0,
    );
    expect(favReq.data.favorited).toBe(false);
  });

  test('3. 详情页遮挡态不泄漏：8 个敏感字段在视图模型与整页 data 中均无有效值', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.redirectTo(PAGES.EXPERT_DETAIL + '?routeId=601');
    await page.waitFor(TIMEOUTS.NETWORK);

    const data = await page.data();
    expect(data.loadError).toBeFalsy();

    // day1 第 2 项：契约合规的 locked 样本（后端敏感字段全 null）
    const lockedNormal = data.days[0].attractions[1];
    expect(lockedNormal.blindDisplayMode).toBe('locked');
    expectNoSensitiveLeak(lockedNormal, 'day1.locked(契约合规样本)');
    // 文字 hint 正常渲染（stationLabel / attractionBlurb / expertIntro / 指数 / 时长）
    expect(lockedNormal.stationLabel).toBe('第 2 站');
    expect(lockedNormal.fuzzyDescription).toBe('一座藏在林子里的古桥，到了才知道');
    expect(lockedNormal.expertIntro).toBe('我在这里藏了一座小众古桥');
    expect(lockedNormal.classicRating).toBe('4.6');
    expect(lockedNormal.leisureRating).toBe('4.9');
    expect(lockedNormal.durationHint).toBe('1小时');
    // attractionNotes 为 null → categoryHint 顶位、prepHint 空串（映射侧兜底）
    expect(lockedNormal.categoryHint).toBe('室外');
    expect(lockedNormal.prepHint).toBe('');

    // day2 第 1 项：**对抗样本**——mock 故意误下发 name/坐标/附件，前端必须全部剥掉
    const lockedAdversarial = data.days[1].attractions[0];
    expect(lockedAdversarial.blindDisplayMode).toBe('locked');
    expectNoSensitiveLeak(lockedAdversarial, 'day2.locked(对抗样本)');

    // 整页 data（含 sanitize 后的原始 detail）不得出现对抗样本的敏感值
    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain('泄漏测试');
    expect(serialized).not.toContain('秘密山顶');
    expect(serialized).not.toContain('119.51');
    expect(serialized).not.toContain('28.51');

    // DOM 层：遮挡卡不渲染名称节点，页面文本不出现泄漏字符串
    const nameEls = await page.$$('.card-name');
    for (const el of nameEls) {
      const text = await el.text();
      expect(text).not.toContain('泄漏测试');
      expect(text).not.toContain('秘密山顶');
    }
    // visible 卡不受影响：day1 第 1 项名称照常渲染
    expect(data.days[0].attractions[0].attractionName).toBe('杨家堂');
  });

  test('4a. 用达人路线创建行程（填日期）：W5 带 travelDate，成功 redirect 行程详情', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.redirectTo(PAGES.EXPERT_DETAIL + '?routeId=601');
    await page.waitFor(TIMEOUTS.NETWORK);

    // onCreateTap 是 async（内部先 ensureLogin），等一拍再断言面板开关
    await page.callMethod('onCreateTap');
    await page.waitFor(TIMEOUTS.ANIMATION);
    let data = await page.data();
    expect(data.datePickerShow).toBe(true);

    await page.callMethod('onDateConfirm', { detail: { startDate: '2026-11-01' } });
    await page.waitFor(TIMEOUTS.NETWORK);

    const requests = await getRecordedRequests(miniProgram);
    const createReq = requests.find(
      (req) => req.url.indexOf('/wx/expert-route/601/create-itinerary') >= 0,
    );
    expect(createReq).toBeDefined();
    expect(createReq.method).toBe('POST');
    expect(createReq.data.travelDate).toBe('2026-11-01');

    const currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/itinerary-detail/index');
  });

  test('4b. 用达人路线创建行程（跳过日期）：日期非必填，travelDate 传 null', async () => {
    await resetRecordedEvents(miniProgram);
    const page = await miniProgram.redirectTo(PAGES.EXPERT_DETAIL + '?routeId=601');
    await page.waitFor(TIMEOUTS.NETWORK);

    await page.callMethod('onCreateTap');
    await page.waitFor(TIMEOUTS.ANIMATION);
    // travel-date-picker 的「暂不选择日期」回传空 startDate
    await page.callMethod('onDateConfirm', { detail: { startDate: '' } });
    await page.waitFor(TIMEOUTS.NETWORK);

    const requests = await getRecordedRequests(miniProgram);
    const createReq = requests.find(
      (req) => req.url.indexOf('/wx/expert-route/601/create-itinerary') >= 0,
    );
    expect(createReq).toBeDefined();
    // 契约 W5：travelDate 非必填，可为 null；不得拼成字符串 "undefined"/""
    expect(createReq.data.travelDate).toBeNull();

    const currentPage = await miniProgram.currentPage();
    expect(currentPage.path).toBe('pages/itinerary-detail/index');
  });

  test('5. 鼓励入口：非达人行程渲染空，达人行程渲染入口并可打开面板', async () => {
    // 5.1 非达人创建的行程（8801）：W6 available=false → 整块不存在，不留空壳
    await resetRecordedEvents(miniProgram);
    let page = await miniProgram.redirectTo(PAGES.ITINERARY_DETAIL + '?id=8801');
    await page.waitFor(TIMEOUTS.NETWORK);

    let requests = await getRecordedRequests(miniProgram);
    const entryReq = requests.find(
      (req) => req.url.indexOf('/wx/expert-route/reward-entry') >= 0,
    );
    expect(entryReq).toBeDefined();
    expect(Number(entryReq.data.itineraryId)).toBe(8801);

    let data = await page.data();
    expect(data.expertReward).toBeNull();
    expect(await page.$('.expert-reward-entry')).toBeNull();

    // 5.2 达人路线创建的行程（9901）：available=true → 入口渲染，可打开 reward-panel
    await resetRecordedEvents(miniProgram);
    page = await miniProgram.redirectTo(PAGES.ITINERARY_DETAIL + '?id=9901');
    await page.waitFor(TIMEOUTS.NETWORK);

    data = await page.data();
    expect(data.expertReward).not.toBeNull();
    expect(data.expertReward.available).toBe(true);
    expect(data.expertReward.routeId).toBe(601);
    expect(data.expertReward.authorNickname).toBe('阿岳');
    expect(await page.$('.expert-reward-entry')).not.toBeNull();

    await page.callMethod('onOpenExpertReward');
    data = await page.data();
    expect(data.expertRewardShow).toBe(true);
    await page.callMethod('onCloseExpertReward');
    data = await page.data();
    expect(data.expertRewardShow).toBe(false);
  });
});
