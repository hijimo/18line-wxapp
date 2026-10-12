function e2eRequestMock(options) {
  var IMG =
    'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/hero-banner-songyang.png';
  var url = (options && options.url) || '';
  var data = (options && options.data) || {};
  var method = (options && options.method) || 'GET';

  try {
    globalThis.__e2eRequests = globalThis.__e2eRequests || [];
    globalThis.__e2eRequests.push({ url: url, method: method, data: data });
  } catch (e) {}

  function ajax(payload) {
    return { data: { code: 200, msg: 'ok', data: payload }, statusCode: 200 };
  }

  function table(rows) {
    return {
      data: { code: 200, msg: 'ok', rows: rows, total: rows.length },
      statusCode: 200,
    };
  }

  if (url.indexOf('/wx/auth/login') >= 0) {
    return ajax({
      token: 'e2e_token_from_login',
      tourist: { nickname: 'E2E用户', avatarUrl: IMG },
    });
  }

  if (url.indexOf('/wx/auth/getUserInfo') >= 0) {
    return ajax({ nickname: 'E2E用户', avatarUrl: IMG });
  }

  if (url.indexOf('/wx/dict/data/batch') >= 0) {
    return ajax({
      travel_stamina: [
        { dictValue: 'steady', dictLabel: '轻松稳健' },
        { dictValue: 'active', dictLabel: '活力探索' },
      ],
      travel_tourist_like: [
        { dictValue: 'nature', dictLabel: '自然风光' },
        { dictValue: 'food', dictLabel: '地道美食' },
      ],
      travel_food_like: [{ dictValue: 'local', dictLabel: '本地风味' }],
      travel_stay_pref: [{ dictValue: 'boutique', dictLabel: '精品民宿' }],
    });
  }

  if (url.indexOf('/wx/dict/data/type/travel_tourist_like') >= 0) {
    return ajax([
      { dictValue: 'nature', dictLabel: '自然风光' },
      { dictValue: 'history', dictLabel: '人文历史' },
    ]);
  }

  if (url.indexOf('/wx/template/list') >= 0) {
    if (data.keyword) {
      return ajax([
        {
          templateId: 901,
          templateName: data.keyword + '云上秘境',
          coverImage: IMG,
          districtName: '云和县',
        },
      ]);
    }
    return ajax([
      { templateId: 101, templateName: '松阳秘境1', coverImage: IMG, districtName: '松阳县' },
      { templateId: 102, templateName: '松阳秘境2', coverImage: IMG, districtName: '松阳县' },
      { templateId: 103, templateName: '松阳秘境3', coverImage: IMG, districtName: '松阳县' },
      { templateId: 104, templateName: '松阳秘境4', coverImage: IMG, districtName: '松阳县' },
      { templateId: 105, templateName: '松阳秘境5', coverImage: IMG, districtName: '松阳县' },
      { templateId: 106, templateName: '松阳秘境6', coverImage: IMG, districtName: '松阳县' },
    ]);
  }

  if (url.indexOf('/wx/itinerary/auto') >= 0 || url.indexOf('/wx/itinerary/add') >= 0) {
    return ajax({
      itineraryId: 8801,
      itineraryName: data.itineraryName || '杭州市3日游',
      days: data.days || 3,
    });
  }

  if (url.indexOf('/wx/itinerary/edit') >= 0) {
    return ajax(true);
  }

  if (url.indexOf('/wx/itinerary/remove') >= 0) {
    return ajax(true);
  }

  if (url.indexOf('/wx/itinerary/') >= 0 && url.indexOf('/day/') >= 0) {
    return ajax(true);
  }

  if (
    url.indexOf('/wx/itinerary/8801') >= 0 ||
    url.indexOf('/wx/itinerary/5001') >= 0 ||
    url.indexOf('/wx/itinerary/9901') >= 0
  ) {
    return ajax({
      itineraryId: 8801,
      itineraryName: 'E2E杭州3日游',
      province: '330000',
      city: '330100',
      district: '330106',
      provinceName: '浙江省',
      cityName: '杭州市',
      districtName: '西湖区',
      startDate: '2026-07-20',
      days: 2,
      status: '0',
      blindMode: '1',
      daysList: [
        {
          itineraryDayId: 1,
          dayNumber: 1,
          attractionList: [
            {
              attractionId: 301,
              attractionName: '灵隐寺',
              attractionShortName: '灵隐',
              visitDuration: '2小时',
              latitude: 30.24,
              longitude: 120.1,
              blindStatus: '0',
            },
            {
              attractionId: 302,
              attractionName: '九溪烟树',
              visitDuration: '1小时',
              latitude: 30.21,
              longitude: 120.11,
              blindStatus: '0',
            },
          ],
          // 大众常规餐饮：带坐标/人均/营业时间，用于地图餐饮 marker
          breakfast: {
            diningId: 22,
            diningName: '山野食集',
            diningCategory: '0',
            avgCost: 68,
            openTime: '07:00',
            closeTime: '20:30',
            latitude: 30.23,
            longitude: 120.09,
          },
          // 地方特色餐饮：应使用与大众常规不同的图标
          lunch: {
            diningId: 23,
            diningName: '西湖醋鱼馆',
            diningCategory: '1',
            avgCost: 138,
            openTime: '11:00',
            closeTime: '21:00',
            latitude: 30.22,
            longitude: 120.12,
          },
          accommodation: { accommodationId: 11, accommodationName: '云端隐庐' },
        },
        { itineraryDayId: 2, dayNumber: 2, attractionList: [] },
      ],
    });
  }

  if (url.indexOf('/wx/itinerary/list') >= 0) {
    return ajax([
      {
        itineraryId: 8801,
        itineraryName: 'E2E杭州3日游',
        district: '330106',
        districtName: '西湖区',
        startDate: '2026-07-20',
        endDate: '2026-07-21',
        days: 2,
        status: '0',
        createFromLabel: '手动创建',
        blindMode: '1',
        daysList: [
          {
            dayNumber: 1,
            attractionList: [
              { attractionId: 301, attractionName: '灵隐寺', visitDuration: '2小时' },
              { attractionId: 302, attractionName: '九溪烟树', visitDuration: '1小时' },
            ],
            accommodation: { accommodationId: 11, accommodationName: '云端隐庐' },
            breakfast: { diningId: 22, diningName: '山野食集' },
          },
        ],
      },
    ]);
  }

  if (url.indexOf('/wx/attraction/list') >= 0) {
    return table([
      { attractionId: 301, attractionName: '隐潭飞瀑', classicRating: '4.8', blindStatus: '0', attachments: [{ url: IMG }] },
      { attractionId: 302, attractionName: '古道石桥', classicRating: '4.5', blindStatus: '0', attachments: [{ url: IMG }] },
    ]);
  }

  if (url.indexOf('/wx/attraction/') >= 0) {
    return ajax({ attractionId: 301, attractionName: '隐潭飞瀑', attachments: [{ url: IMG }] });
  }

  if (url.indexOf('/wx/checkin/list') >= 0) {
    return table([
      { checkinId: 401, checkinName: '溪畔听风亭', classicRating: '4.7', blindStatus: '0', attachments: [{ url: IMG }] },
      { checkinId: 402, checkinName: '崖顶观星台', classicRating: '4.9', blindStatus: '0', attachments: [{ url: IMG }] },
    ]);
  }

  if (url.indexOf('/wx/dish/featured') >= 0) {
    return ajax([
      { dishId: 501, diningId: 22, diningName: '山野食集', dishName: '土窑鸡', image: IMG, specialStar: 5 },
      { dishId: 502, diningId: 23, diningName: '云上小馆', dishName: '野菜饼', image: IMG, specialStar: 4 },
    ]);
  }

  if (url.indexOf('/wx/dish/list') >= 0) {
    return ajax([{ dishId: 501, dishName: '土窑鸡', attachments: [{ url: IMG }] }]);
  }

  if (url.indexOf('/wx/accommodation/list') >= 0) {
    return table([
      { accommodationId: 201, accommodationName: '云端隐庐', accommodationDesc: '松阳古村精品民宿', accommodationType: '精品民宿', priceMin: 380, priceMax: 680, attachments: [{ url: IMG }] },
      { accommodationId: 202, accommodationName: '松阳茶舍', accommodationDesc: '茶园环绕的静谧住所', accommodationType: '特色民宿', priceMin: 280, priceMax: 480, attachments: [{ url: IMG }] },
    ]);
  }

  if (url.indexOf('/wx/accommodation/updateDay') >= 0 || url.indexOf('/wx/itinerary/day/accommodation') >= 0) {
    return ajax(true);
  }

  if (url.indexOf('/wx/dining/list') >= 0) {
    // 带坐标/类别/人均/营业时间：行程详情地图的目的地餐饮池取自这个接口
    return table([
      {
        diningId: 301,
        diningName: '山野食集',
        diningDesc: '松阳本地农家菜',
        diningCategory: '0',
        avgCost: 68,
        openTime: '07:00',
        closeTime: '20:30',
        latitude: 30.23,
        longitude: 120.09,
        attachments: [{ url: IMG }],
      },
      {
        diningId: 302,
        diningName: '云上小馆',
        diningDesc: '古村落家常菜',
        diningCategory: '1',
        avgCost: 55,
        openTime: '11:00',
        closeTime: '21:00',
        latitude: 30.22,
        longitude: 120.12,
        attachments: [{ url: IMG }],
      },
    ]);
  }

  if (url.indexOf('/wx/dining/updateDay') >= 0 || url.indexOf('/wx/itinerary/day/dining') >= 0) {
    return ajax(true);
  }

  if (url.indexOf('/wx/car/list') >= 0) {
    return table([
      { carId: 401, nickname: '张师傅', carModel: '别克GL8', seatCount: 7, drivingYears: 8, price: 500, attachments: [{ url: IMG }] },
    ]);
  }

  if (url.indexOf('/wx/car/add') >= 0 || url.indexOf('/wx/itinerary/day/car') >= 0) {
    return ajax(true);
  }

  if (url.indexOf('/wx/photography/list') >= 0) {
    return table([
      { photographyId: 501, nickname: '小林摄影', introduction: '松阳在地旅拍', equipment: 'Canon R5', price: 800, attachments: [{ url: IMG }] },
    ]);
  }

  if (url.indexOf('/wx/photography/add') >= 0 || url.indexOf('/wx/itinerary/day/photography') >= 0) {
    return ajax(true);
  }

  if (url.indexOf('/wx/localSpecialty/list') >= 0 || url.indexOf('/wx/weather/forecast') >= 0) {
    return ajax([]);
  }

  if (url.indexOf('/wx/preference') >= 0) {
    return ajax({ preferenceId: 7001 });
  }

  // ==================== 达人推荐路线（W1~W6） ====================
  // 匹配顺序：具体路径在前，`/wx/expert-route/{id}` 详情兜底在后
  // （/favorite、/create-itinerary 的 URL 同样包含 /wx/expert-route/601 前缀）

  if (url.indexOf('/wx/expert-route/list') >= 0) {
    return table([
      {
        routeId: 601,
        routeTitle: '松阳古村三日慢走',
        coverUrl: IMG,
        authorNickname: '阿岳',
        authorAvatar: IMG,
        regionName: '丽水市松阳县',
        dayCount: 3,
        attractionCount: 8,
        favoriteCount: 12,
        favorited: false,
        intro: '住在古村，走在茶山',
        rewardAvailable: true,
        createTime: '2026-10-01 10:00:00',
      },
      {
        routeId: 602,
        routeTitle: '缙云仙都两日摄影线',
        coverUrl: IMG,
        authorNickname: '老周',
        authorAvatar: '',
        regionName: '丽水市缙云县',
        dayCount: 2,
        attractionCount: 5,
        favoriteCount: 3,
        favorited: true,
        intro: '',
        rewardAvailable: false,
        createTime: '2026-10-02 10:00:00',
      },
    ]);
  }

  if (url.indexOf('/wx/expert-route/favorites') >= 0) {
    return table([
      {
        routeId: 602,
        routeTitle: '缙云仙都两日摄影线',
        coverUrl: IMG,
        authorNickname: '老周',
        authorAvatar: '',
        regionName: '丽水市缙云县',
        dayCount: 2,
        attractionCount: 5,
        favoriteCount: 3,
        favorited: true,
        intro: '',
        rewardAvailable: false,
        createTime: '2026-10-02 10:00:00',
      },
    ]);
  }

  if (url.indexOf('/wx/expert-route/reward-entry') >= 0) {
    // 9901 = 达人路线创建的行程（旁路映射存在）→ available:true
    if (Number(data.itineraryId) === 9901) {
      return ajax({
        available: true,
        blockReason: null,
        routeId: 601,
        routeTitle: '松阳古村三日慢走',
        authorNickname: '阿岳',
        authorAvatar: IMG,
        itineraryId: 9901,
        tiers: [
          { tierCode: 'T1', tierName: '鼓励', priceFen: 100, isTest: '0', sortOrder: 1 },
        ],
      });
    }
    // 其它行程（含 8801 手动创建）→ available:false，不报错
    return ajax({ available: false, blockReason: '非达人路线创建的行程' });
  }

  if (url.indexOf('/create-itinerary') >= 0 && url.indexOf('/wx/expert-route/') >= 0) {
    return ajax({ itineraryId: 8801, itineraryTitle: '松阳古村三日慢走' });
  }

  if (url.indexOf('/favorite') >= 0 && url.indexOf('/wx/expert-route/') >= 0) {
    return ajax({
      favorited: data.favorited === true,
      favoriteCount: data.favorited === true ? 13 : 11,
    });
  }

  if (url.indexOf('/wx/expert-route/') >= 0) {
    // W2 详情。day1.locked 为契约合规样本（敏感字段全 null）；
    // day2.locked 为**对抗样本**：故意带上契约规定 locked 态不下发的敏感字段，
    // 用于验证前端白名单兜底——即使后端误下发，也不得进入渲染视图模型。
    return ajax({
      routeId: 601,
      routeTitle: '松阳古村三日慢走',
      coverUrl: IMG,
      authorNickname: '阿岳',
      authorAvatar: IMG,
      intro: '住在古村，走在茶山',
      regionName: '丽水市松阳县',
      dayCount: 2,
      attractionCount: 3,
      favoriteCount: 12,
      favorited: false,
      rewardEnabled: true,
      rewardAvailable: true,
      createTime: '2026-10-01 10:00:00',
      days: [
        {
          routeDayId: 1,
          dayIndex: 1,
          dayTheme: '古村入门',
          dayIntro: '先在村里走一走',
          accommodationName: null,
          breakfastName: null,
          lunchName: null,
          dinnerName: null,
          carNickname: null,
          photographyNickname: null,
          attractions: [
            {
              attractionId: 301,
              sortOrder: 1,
              displayMode: 'visible',
              stationLabel: '第 1 站',
              attractionName: '杨家堂',
              attractionShortName: '杨家堂',
              attractionDescription: '金色布达拉宫',
              attractionBlurb: '活着的古村落',
              expertIntro: '这里的晨雾最好看',
              indoorOutdoor: '室外',
              visitDuration: '2小时',
              attractionNotes: '建议穿防滑鞋',
              classicRating: '4.8',
              leisureRating: '4.5',
              longitude: 119.4,
              latitude: 28.4,
              fuzzyLongitude: null,
              fuzzyLatitude: null,
              fuzzyRadius: null,
              attachments: [{ url: IMG }],
              openTime: '08:00-18:00',
              bestViewingTime: null,
              ticketPriceA: 0,
              ticketPriceC: 0,
            },
            {
              attractionId: 302,
              sortOrder: 2,
              displayMode: 'locked',
              stationLabel: '第 2 站',
              attractionName: null,
              attractionShortName: null,
              attractionDescription: null,
              attractionBlurb: '一座藏在林子里的古桥，到了才知道',
              expertIntro: '我在这里藏了一座小众古桥',
              indoorOutdoor: '室外',
              visitDuration: '1小时',
              attractionNotes: null,
              classicRating: '4.6',
              leisureRating: '4.9',
              longitude: null,
              latitude: null,
              fuzzyLongitude: null,
              fuzzyLatitude: null,
              fuzzyRadius: null,
              attachments: null,
              openTime: null,
              bestViewingTime: null,
              ticketPriceA: null,
              ticketPriceC: null,
            },
          ],
        },
        {
          routeDayId: 2,
          dayIndex: 2,
          dayTheme: '茶山秘境',
          dayIntro: null,
          accommodationName: null,
          breakfastName: null,
          lunchName: null,
          dinnerName: null,
          carNickname: null,
          photographyNickname: null,
          attractions: [
            {
              attractionId: 303,
              sortOrder: 1,
              displayMode: 'locked',
              stationLabel: '第 1 站',
              attractionName: '泄漏测试_秘密山顶',
              attractionShortName: '秘密山顶',
              attractionDescription: '泄漏测试_描述',
              attractionBlurb: '云海观景台',
              expertIntro: '山顶看日出',
              indoorOutdoor: '室外',
              visitDuration: '1.5小时',
              attractionNotes: '带件外套',
              classicRating: '4.7',
              leisureRating: '4.4',
              longitude: 119.5,
              latitude: 28.5,
              fuzzyLongitude: 119.51,
              fuzzyLatitude: 28.51,
              fuzzyRadius: 800,
              attachments: [{ url: IMG }],
              openTime: '全天',
              bestViewingTime: null,
              ticketPriceA: null,
              ticketPriceC: null,
            },
          ],
        },
      ],
    });
  }

  return ajax(null);
}

module.exports = {
  e2eRequestMock,
};
