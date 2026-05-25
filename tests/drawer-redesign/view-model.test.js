const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const test = require('node:test');
const ts = require('typescript');
const vm = require('vm');

const root = path.resolve(__dirname, '../../miniprogram/components');

function loadViewModelFactory(drawer, factoryName) {
  const filePath = path.join(root, drawer, `${drawer}.ts`);
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(
    `${source}\nmodule.exports = { ${factoryName} };`,
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2019,
      },
    },
  ).outputText;
  const sandbox = {
    Component() {},
    module: { exports: {} },
    exports: {},
    wx: {},
  };

  vm.createContext(sandbox);
  vm.runInContext(compiled, sandbox, { filename: filePath });

  return sandbox.module.exports[factoryName];
}

test('car drawer view model handles complete and empty car data', () => {
  const createViewModel = loadViewModelFactory(
    'car-intro-drawer',
    'createCarIntroViewModel',
  );
  const complete = createViewModel({
    nickname: '阿明司机',
    price: 680,
    carModel: '丰田商务',
    seatCount: 7,
    drivingYears: 12,
    contactInfo: '13800000000',
    attachments: [{ url: '' }, { fileUrl: 'https://example.com/car.jpg' }],
  });
  const empty = createViewModel({});

  assert.equal(complete.title, '阿明司机');
  assert.equal(complete.costText, '¥680/day');
  assert.deepEqual(complete.images, ['https://example.com/car.jpg']);
  assert.ok(complete.serviceTags.includes('丰田商务'));
  assert.ok(complete.serviceTags.includes('7座'));
  assert.ok(complete.hasDetails);
  assert.equal(empty.title, '包车详情');
  assert.equal(empty.hasGallery, false);
  assert.equal(empty.hasDetails, false);
});

test('hotel drawer view model handles address, price, facilities and empty images', () => {
  const createViewModel = loadViewModelFactory(
    'hotel-intro-drawer',
    'createHotelIntroViewModel',
  );
  const complete = createViewModel({
    accommodationName: '云上民宿',
    province: '浙江省',
    city: '丽水市',
    district: '云和县',
    accommodationType: '精品民宿',
    breakfastIncluded: 'Y',
    petFriendly: 'Y',
    priceMin: 580,
    priceMax: 920,
    attachments: [],
  });
  const empty = createViewModel({ accommodationName: '' });

  assert.equal(complete.title, '云上民宿');
  assert.equal(complete.address, '浙江省丽水市云和县');
  assert.equal(complete.costText, '¥580 - ¥920');
  assert.ok(complete.tags.includes('精品民宿'));
  assert.ok(complete.tags.includes('含早餐'));
  assert.ok(complete.tags.includes('宠物友好'));
  assert.equal(complete.hasGallery, false);
  assert.equal(empty.title, '住宿详情');
  assert.equal(empty.hasDetails, false);
});

test('photography drawer view model handles service content, price, tags and fallbacks', () => {
  const createViewModel = loadViewModelFactory(
    'photography-intro-drawer',
    'createPhotographyIntroViewModel',
  );
  const complete = createViewModel({
    nickname: '林溪摄影',
    price: 399,
    recommendRating: 4.9,
    equipment: '无人机跟拍',
    gender: '女',
    contactInfo: 'wechat-linxi',
    attachments: [{ url: 'https://example.com/photo.jpg' }],
  });
  const empty = createViewModel(null);

  assert.equal(complete.title, '林溪摄影');
  assert.equal(complete.costText, '¥399');
  assert.ok(complete.serviceTags.includes('无人机跟拍'));
  assert.ok(complete.serviceTags.includes('推荐指数 4.9'));
  assert.ok(complete.profileTags.includes('摄影师 女'));
  assert.deepEqual(complete.images, ['https://example.com/photo.jpg']);
  assert.equal(empty.title, '跟拍详情');
  assert.equal(empty.hasDetails, false);
});

test('attraction drawer view model handles empty and multiple check-in points', () => {
  const createViewModel = loadViewModelFactory(
    'attraction-intro-drawer',
    'createAttractionIntroViewModel',
  );
  const complete = createViewModel({
    attractionName: '古桥湿地',
    attractionShortName: '古桥',
    city: '丽水市',
    district: '莲都区',
    classicRating: 4.7,
    perCost: 20,
    attractionType: '自然风光',
    checkinPoints: [
      {
        name: '古桥入口',
        description: '从桥头牌坊开始记录。',
        imageUrl: 'https://example.com/checkin.jpg',
        status: 'Y',
      },
      {
        pointName: '',
        desc: '没有名称时使用序号兜底。',
        checked: false,
      },
    ],
  });
  const emptyPoints = createViewModel({
    attractionName: '空点位景区',
    checkInPoints: [],
  });

  assert.equal(complete.title, '古桥');
  assert.equal(complete.costText, '¥20/person');
  assert.ok(complete.tags.includes('自然风光'));
  assert.equal(complete.checkInPoints.length, 2);
  assert.equal(complete.checkInPoints[0].statusText, '已打卡');
  assert.equal(complete.checkInPoints[0].imageUrl, 'https://example.com/checkin.jpg');
  assert.equal(complete.checkInPoints[1].name, '打卡点 2');
  assert.equal(complete.checkInPoints[1].statusText, '未打卡');
  assert.equal(emptyPoints.checkInPoints.length, 0);
  assert.equal(emptyPoints.hasGallery, false);
});
