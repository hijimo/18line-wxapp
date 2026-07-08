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

  if (url.indexOf('/wx/itinerary/8801') >= 0 || url.indexOf('/wx/itinerary/5001') >= 0) {
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
          breakfast: { diningId: 22, diningName: '山野食集' },
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

  if (url.indexOf('/wx/localSpecialty/list') >= 0 || url.indexOf('/wx/weather/forecast') >= 0) {
    return ajax([]);
  }

  if (url.indexOf('/wx/preference') >= 0) {
    return ajax({ preferenceId: 7001 });
  }

  return ajax(null);
}

module.exports = {
  e2eRequestMock,
};
