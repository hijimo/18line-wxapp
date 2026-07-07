const { loadTs } = require('./ts-loader');

const M = loadTs('pages/index/home-mappers.ts');

describe('home-mappers 纯函数单元测试', () => {
  describe('parseHours', () => {
    test('解析小时/分钟/纯数字', () => {
      expect(M.parseHours('2小时')).toBe(2);
      expect(M.parseHours('120分钟')).toBe(2);
      expect(M.parseHours('2.5')).toBe(2.5);
      expect(M.parseHours('')).toBe(0);
      expect(M.parseHours(undefined)).toBe(0);
    });
  });

  describe('formatJourneyDateRange', () => {
    test('起止日期', () => {
      expect(M.formatJourneyDateRange('2026-08-20', '2026-08-22')).toBe('08.20 - 08.22');
    });
    test('仅起始+天数推算结束', () => {
      expect(M.formatJourneyDateRange('2026-09-10', undefined, 3)).toBe('09.10 - 09.12');
    });
    test('缺失返回规划中', () => {
      expect(M.formatJourneyDateRange(undefined, undefined)).toBe('规划中');
    });
  });

  describe('buildGoalTitle', () => {
    test('景点数 + 约 X 小时', () => {
      const day = {
        attractionList: [
          { attractionName: 'A', visitDuration: '1小时' },
          { attractionName: 'B', visitDuration: '2小时' },
          { attractionName: 'C', visitDuration: '2小时' },
        ],
      };
      expect(M.buildGoalTitle(day)).toBe('当天 3 个景点 · 约 5 小时');
    });
    test('无时长只显示景点数', () => {
      const day = { attractionList: [{ attractionName: 'A' }] };
      expect(M.buildGoalTitle(day)).toBe('当天 1 个景点');
    });
    test('空日程返回空串', () => {
      expect(M.buildGoalTitle({ attractionList: [] })).toBe('');
      expect(M.buildGoalTitle(undefined)).toBe('');
    });
  });

  describe('pickCurrentDay', () => {
    const itinerary = {
      startDate: '2026-07-01',
      days: 3,
      daysList: [{ dayNumber: 1 }, { dayNumber: 2 }, { dayNumber: 3 }],
    };
    test('今天落在行程内选对应当天', () => {
      const day = M.pickCurrentDay(itinerary, new Date(2026, 6, 2)); // 7/2 → day2
      expect(day.dayNumber).toBe(2);
    });
    test('今天在行程之外回退第1天', () => {
      const day = M.pickCurrentDay(itinerary, new Date(2026, 0, 1));
      expect(day.dayNumber).toBe(1);
    });
  });

  describe('buildDestinationImages', () => {
    test('盲游景点标记 blurred，缺图用默认图', () => {
      const itinerary = { blindMode: '0' };
      const day = {
        attractionList: [
          { attractionName: '明景点', blindStatus: '0', attachments: [{ url: 'a.png' }] },
          { attractionName: '盲景点', blindStatus: '1' },
        ],
      };
      const imgs = M.buildDestinationImages(itinerary, day);
      expect(imgs.length).toBe(2);
      expect(imgs[0]).toEqual({ image: 'a.png', blurred: false });
      expect(imgs[1].blurred).toBe(true);
      expect(imgs[1].image).toBe(M.DEFAULT_DESTINATION_IMAGE);
    });
    test('全明模式(blindMode=1)不遮蔽', () => {
      const itinerary = { blindMode: '1' };
      const day = { attractionList: [{ attractionName: '', attachments: [{ url: 'x.png' }] }] };
      const imgs = M.buildDestinationImages(itinerary, day);
      expect(imgs[0].blurred).toBe(false);
    });
  });

  describe('mapJourney', () => {
    test('酒店缺失用默认图，餐厅取名，district 透传', () => {
      const itinerary = {
        itineraryId: 7,
        itineraryName: '松阳秘境',
        district: '331124',
        districtName: '松阳县',
        startDate: '2026-07-01',
        days: 2,
        totalCost: 2499,
        blindMode: '1',
        daysList: [
          {
            dayNumber: 1,
            attractionList: [{ attractionName: 'A', visitDuration: '2小时', attachments: [{ url: 'a.png' }] }],
            breakfast: { diningId: 22, diningName: '山野食集', attachments: [{ url: 'r.png' }] },
          },
          { dayNumber: 2, attractionList: [] },
        ],
      };
      const vm = M.mapJourney(itinerary, new Date(2026, 6, 1)); // day1
      expect(vm.id).toBe('7');
      expect(vm.district).toBe('331124');
      expect(vm.goalTitle).toBe('当天 1 个景点 · 约 2 小时');
      expect(vm.hotel.isDefault).toBe(true);
      expect(vm.hotel.image).toBe(M.DEFAULT_HOTEL_IMAGE);
      expect(vm.restaurant.name).toBe('山野食集');
      expect(vm.restaurant.diningId).toBe(22);
      expect(vm.days.length).toBe(2);
      expect(vm.days[0].status).toBe('active');
    });
  });

  describe('三大发现映射', () => {
    test('mapSecretAttractions 盲游脱敏', () => {
      const cards = M.mapSecretAttractions([
        { attractionId: 1, attractionName: '飞瀑', classicRating: '4.8', blindStatus: '0', attachments: [{ url: 'p.png' }] },
        { attractionId: 2, attractionName: '暗景', classicRating: '4.6', blindStatus: '1' },
      ]);
      expect(cards[0].title).toBe('飞瀑');
      expect(cards[0].blurred).toBe(false);
      expect(cards[1].title).toBe(M.MYSTERY_NAME);
      expect(cards[1].blurred).toBe(true);
    });
    test('mapHiddenCheckins 默认免费', () => {
      const gems = M.mapHiddenCheckins([{ checkinId: 9, checkinName: '听风亭', classicRating: '4.7' }]);
      expect(gems[0].price).toBe('免费');
      expect(gems[0].checkinId).toBe(9);
    });
    test('mapLocalDishes 高星标 must-try', () => {
      const foods = M.mapLocalDishes([
        { dishId: 1, diningId: 22, dishName: '土窑鸡', specialStar: 5, image: 'd.png' },
        { dishId: 2, diningId: 22, dishName: '野菜饼', specialStar: 3 },
      ]);
      expect(foods[0].tagType).toBe('must-try');
      expect(foods[1].tagType).toBe('seasonal');
      expect(foods[1].image).toBe(M.DEFAULT_DINING_IMAGE);
    });
  });

  describe('mapBanners / mapSearchResults', () => {
    test('banner 取前5并映射', () => {
      const tpls = [];
      for (let i = 1; i <= 8; i++) tpls.push({ templateId: i, templateName: 'T' + i, price: 100 * i, coverImage: 'c' + i });
      const banners = M.mapBanners(tpls, 5);
      expect(banners.length).toBe(5);
      expect(banners[0].id).toBe('1');
      expect(banners[0].price).toBe('¥100');
    });
    test('search 结果映射 templateId', () => {
      const rs = M.mapSearchResults([{ templateId: 3, templateName: '梯田', districtName: '云和县', coverImage: 'x' }]);
      expect(rs[0].templateId).toBe(3);
      expect(rs[0].title).toBe('梯田');
    });
  });
});
