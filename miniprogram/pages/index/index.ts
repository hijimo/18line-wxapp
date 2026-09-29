import { getTemplateList } from '../../services/template';
import {
  getItineraryList,
  getItinerary,
  updateDayAttractions,
  updateDayDining,
} from '../../services/itinerary';
import {
  getAttractionList,
  getAttractionDetail,
} from '../../services/attraction';
import { getCheckinList, getCheckinDetail } from '../../services/checkin';
import { getFeaturedDishes, getDishesByDining } from '../../services/dish';
import { getDiningDetail } from '../../services/dining';
import { getDistrictCache, setDistrictCache } from '../../utils/district-cache';
import {
  DEFAULT_DISTRICT_OPTION,
  DISTRICT_OPTIONS,
  buildRegionQueryByCode,
  findDistrictOption,
  getStoredDistrictOption,
  setSelectedDistrict,
  type DistrictOption,
} from '../../utils/district';
import { ensureLogin, ensurePrivacyAgreed } from '../../utils/ensure-login';
import { getToken } from '../../utils/request';
import {
  mapJourneys,
  mapSecretAttractions,
  mapHiddenCheckins,
  mapLocalDishes,
  mapSearchResults,
  firstImage,
  DEFAULT_DISTRICT,
  DEFAULT_DISTRICT_NAME,
  type JourneyCardVM,
  type InspirationCardVM,
  type GemItemVM,
  type FoodCardVM,
} from './home-mappers';

let searchTimer: any = null;

Component({
  data: {
    userInfo: {
      avatarUrl:
        'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/user-profile.png',
      nickName: '',
    },
    hasJourneys: true,
    journeys: [] as JourneyCardVM[],
    activeJourneyIndex: 0,
    districtOptions: DISTRICT_OPTIONS,
    districtIndex: 0,
    currentDistrict: DEFAULT_DISTRICT,
    currentDistrictName: DEFAULT_DISTRICT_NAME,
    inspirationTitle: '地道灵感：探索秘境',
    inspirationCards: [] as InspirationCardVM[],
    eggs: [] as GemItemVM[],
    foods: [] as FoodCardVM[],
    localLoading: false,
    // 搜索
    searchActive: false,
    searchKeyword: '',
    searchHint: '最新上线',
    searchResults: [] as any[],
    // 抽屉
    showIntroDrawer: '' as '' | 'attraction' | 'dining',
    introData: null as any,
    introContext: null as any,
    // 添加到行程选择面板
    addFlow: {
      visible: false,
      step: 'itinerary' as 'itinerary' | 'day' | 'meal',
      title: '',
      itineraries: [] as any[],
      days: [] as any[],
      chosenItineraryId: '' as string,
      chosenDay: 0,
    },
  },
  pageLifetimes: {
    show() {
      // 进入首页先判断本地是否已登录（仅判断 localStorage 是否有 token）。
      // 已登录才调用「我的行程」接口；未登录则只展示首页当地信息，
      // 避免一进入程序就触发登录，让用户先浏览首页再决定是否登录使用。
      // 「当地」优先取用户上次手动选择的地址，无记录则默认松阳县。
      const target = getStoredDistrictOption() || DEFAULT_DISTRICT_OPTION;
      (this as any).applyDistrict(target);
      if (getToken()) {
        (this as any).loadJourneys();
      } else {
        this.setData({ hasJourneys: false, journeys: [] });
        (this as any).loadLocal(target.code);
      }
    },
  },
  methods: {
    async loadJourneys() {
      try {
        const res = await getItineraryList();
        const list = (res.data || []).slice(0, 5);
        const journeys = mapJourneys(list);
        if (journeys.length > 0) {
          await (this as any).enrichRestaurantImages(journeys);
          const first = journeys[0];
          // 「当地」优先级：用户手动选择 > 首个行程所在县（须在地址切换列表内）> 默认松阳县
          const target =
            getStoredDistrictOption() ||
            findDistrictOption(first.district) ||
            DEFAULT_DISTRICT_OPTION;
          this.setData({
            journeys,
            hasJourneys: true,
            activeJourneyIndex: 0,
          });
          (this as any).applyDistrict(target);
          (this as any).loadLocal(target.code);
        } else {
          this.setData({ journeys: [], hasJourneys: false });
          (this as any).loadLocal(this.data.currentDistrict || DEFAULT_DISTRICT);
        }
      } catch (err) {
        console.error('Failed to load journeys:', err);
        (this as any).loadLocal(this.data.currentDistrict || DEFAULT_DISTRICT);
      }
    },

    // 餐厅角标背景取该餐厅特色菜首图
    async enrichRestaurantImages(journeys: JourneyCardVM[]) {
      await Promise.all(
        journeys.map(async (j) => {
          const diningId = j.restaurant && j.restaurant.diningId;
          if (!diningId) return;
          try {
            const res = await getDishesByDining(diningId);
            const dishes = res.data || [];
            for (const dish of dishes) {
              const img = firstImage(dish.attachments);
              if (img) {
                j.restaurant.image = img;
                j.restaurant.isDefault = false;
                break;
              }
            }
          } catch {
            // 保留默认/餐厅图
          }
        }),
      );
    },

    onJourneyChange(e: any) {
      const { index, district } = e.detail || {};
      this.setData({ activeJourneyIndex: index });
      // 「当地」跟随行程卡片，但仅限地址切换列表内的县；列表外行程不改变当地
      const option = findDistrictOption(district);
      if (!option || option.code === this.data.currentDistrict) return;
      (this as any).applyDistrict(option);
      (this as any).loadLocal(option.code);
    },

    /* -------------------- 地址切换（当地） -------------------- */
    /** 将地址选项应用到「当地」状态（驱动顶部切换器与三列表） */
    applyDistrict(option: DistrictOption) {
      const index = DISTRICT_OPTIONS.findIndex((o) => o.code === option.code);
      this.setData({
        districtIndex: index >= 0 ? index : 0,
        currentDistrict: option.code,
        currentDistrictName: option.name,
      });
    },

    /** 顶部地址切换器选择 */
    onDistrictChange(e: any) {
      const index = Number(e.detail.value);
      const option = DISTRICT_OPTIONS[index];
      if (!option || option.code === this.data.currentDistrict) return;
      (this as any).applyDistrict(option);
      // 手动选择的「当地」持久化，作为下次进入首页/创建行程/集市的默认地址
      setSelectedDistrict(option.code);
      (this as any).loadLocal(option.code);
    },

    async loadLocal(district: string) {
      if (!district) district = DEFAULT_DISTRICT;
      this.setData({ localLoading: true });
      await Promise.all([
        (this as any).loadSecret(district),
        (this as any).loadHidden(district),
        (this as any).loadFood(district),
      ]);
      this.setData({ localLoading: false });
    },

    async loadSecret(district: string) {
      const cached = getDistrictCache<InspirationCardVM[]>('secret', district);
      if (cached) {
        this.setData({ inspirationCards: cached });
        return;
      }
      try {
        // 探索秘境只展示非盲游景点（接口层用 blindStatus='0' 过滤）
        // 地区参数按「当地」选项层级下发：县域传 district，市级只传 city
        const res = await getAttractionList({
          ...buildRegionQueryByCode(district),
          minClassicRating: 4,
          blindStatus: '0',
          pageSize: 5,
        });
        const cards = mapSecretAttractions(res.rows || []);
        setDistrictCache('secret', district, cards);
        if (this.data.currentDistrict !== district) return; // 已切换当地，丢弃过期响应
        this.setData({ inspirationCards: cards });
      } catch (err) {
        console.error('Failed to load secret attractions:', err);
      }
    },

    async loadHidden(district: string) {
      const cached = getDistrictCache<GemItemVM[]>('hidden', district);
      if (cached) {
        this.setData({ eggs: cached });
        return;
      }
      try {
        // 隐匿之藏同样过滤盲游打卡点
        const res = await getCheckinList({
          ...buildRegionQueryByCode(district),
          minClassicRating: 4,
          blindStatus: '0',
          pageSize: 5,
        });
        const items = mapHiddenCheckins(res.rows || []);
        setDistrictCache('hidden', district, items);
        if (this.data.currentDistrict !== district) return; // 已切换当地，丢弃过期响应
        this.setData({ eggs: items });
      } catch (err) {
        console.error('Failed to load hidden checkins:', err);
      }
    },

    async loadFood(district: string) {
      const cached = getDistrictCache<FoodCardVM[]>('food', district);
      if (cached) {
        this.setData({ foods: cached });
        return;
      }
      try {
        const res = await getFeaturedDishes(buildRegionQueryByCode(district));
        const items = mapLocalDishes(res.data || []);
        setDistrictCache('food', district, items);
        if (this.data.currentDistrict !== district) return; // 已切换当地，丢弃过期响应
        this.setData({ foods: items });
      } catch (err) {
        console.error('Failed to load local dishes:', err);
      }
    },

    /* -------------------- 搜索 -------------------- */
    async onSearchOpen() {
      this.setData({
        searchActive: true,
        searchKeyword: '',
        searchHint: '最新上线',
      });
      await (this as any).loadLatestLines();
    },

    async loadLatestLines() {
      try {
        const res = await getTemplateList();
        const results = mapSearchResults((res.data || []).slice(0, 5));
        this.setData({ searchResults: results, searchHint: '最新上线' });
      } catch (err) {
        console.error('Failed to load latest lines:', err);
      }
    },

    onSearchInput(e: any) {
      const keyword = e.detail.value || '';
      this.setData({ searchKeyword: keyword });
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        (this as any).runSearch(keyword);
      }, 300);
    },

    async runSearch(keyword: string) {
      const kw = (keyword || '').trim();
      if (!kw) {
        await (this as any).loadLatestLines();
        return;
      }
      try {
        const res = await getTemplateList({ keyword: kw });
        const results = mapSearchResults(res.data || []);
        this.setData({ searchResults: results, searchHint: '搜索结果' });
      } catch (err) {
        console.error('Search failed:', err);
      }
    },

    onSearchClose() {
      if (searchTimer) {
        clearTimeout(searchTimer);
        searchTimer = null;
      }
      this.setData({
        searchActive: false,
        searchKeyword: '',
        searchResults: [],
      });
    },

    onSearchResultTap(e: any) {
      const id = e.currentTarget.dataset.id;
      if (!id) return;
      this.setData({ searchActive: false });
      wx.navigateTo({ url: `/pages/itinerary-detail/index?templateId=${id}` });
    },

    /* -------------------- 三大发现点击 -------------------- */
    async onInspirationTap(e: any) {
      const { id } = e.detail;
      const card = (this.data.inspirationCards || []).find((c) => c.id === id);
      if (!card) return;
      if (card.blurred || !card.attractionId) {
        wx.showToast({ title: '到达后揭晓', icon: 'none' });
        return;
      }
      try {
        const res = await getAttractionDetail(card.attractionId);
        this.setData({
          showIntroDrawer: 'attraction',
          introData: res.data,
          introContext: {
            type: 'attraction',
            attractionId: card.attractionId,
            name: card.title,
          },
        });
      } catch (err) {
        console.error('Failed to load attraction detail:', err);
      }
    },

    async onEggTap(e: any) {
      const { id } = e.detail;
      const item = (this.data.eggs || []).find((c) => c.id === id);
      if (!item) return;
      if (item.blurred || !item.checkinId) {
        wx.showToast({ title: '到达后揭晓', icon: 'none' });
        return;
      }
      try {
        const res = await getCheckinDetail(item.checkinId);
        const c = res.data || ({} as any);
        // 复用景点介绍抽屉：将打卡点字段映射到抽屉数据结构
        const introData = {
          attractionName: c.checkinName,
          attractionShortName: c.checkinShortName,
          attractionDescription: c.checkinDescription,
          attractionBlurb: c.checkinBlurb,
          province: c.province,
          city: c.city,
          district: c.district,
          longitude: c.longitude,
          latitude: c.latitude,
          classicRating: c.classicRating,
          leisureRating: c.leisureRating,
          visitDuration: c.visitDuration,
          openTime: c.openTime,
          perCost: c.perCost,
          attachments: c.attachments,
        };
        this.setData({
          showIntroDrawer: 'attraction',
          introData,
          // 打卡点无独立日程槽位，添加时落到其所属景点
          introContext: {
            type: 'checkin',
            attractionId: c.attractionId,
            name: item.title,
          },
        });
      } catch (err) {
        console.error('Failed to load checkin detail:', err);
      }
    },

    async onFoodTap(e: any) {
      const { id } = e.detail;
      const item = (this.data.foods || []).find((c) => c.id === id);
      if (!item || !item.diningId) return;
      try {
        const res = await getDiningDetail(item.diningId);
        const d = res.data || ({} as any);
        this.setData({
          showIntroDrawer: 'dining',
          introData: d,
          // 地道风物添加行程 = 把该餐厅加入某天某餐
          introContext: {
            type: 'dish',
            diningId: item.diningId,
            name: d.diningName || item.name,
          },
        });
      } catch (err) {
        console.error('Failed to load dining detail:', err);
      }
    },

    onIntroClose() {
      this.setData({ showIntroDrawer: '', introData: null });
    },

    // 阻止面板内部点击冒泡到遮罩
    noop() {},

    /* -------------------- 添加到行程 -------------------- */
    // 抽屉「添加到行程」主动作
    async onAddToItinerary() {
      // 拉取完整行程列表（首页 journeys 仅取前 5，选择器需覆盖全部）
      let list: any[] = [];
      try {
        const res = await getItineraryList();
        list = res.data || [];
      } catch (err) {
        console.error('load itineraries for add failed:', err);
        list = (this.data.journeys || []).map((j) => ({
          itineraryId: j.id,
          itineraryName: j.title,
          days: (j.days || []).length,
        }));
      }
      if (list.length === 0) {
        wx.showModal({
          title: '还没有行程',
          content: '您还没有寻觅之旅，先去创建一个吧',
          confirmText: '去创建',
          cancelText: '取消',
          success: async (r) => {
            if (r.confirm) {
              const ok = await ensurePrivacyAgreed();
              if (!ok) return;
              const logged = await ensureLogin();
              if (!logged) return;
              wx.navigateTo({ url: '/pages/create-itinerary/index' });
            }
          },
        });
        return;
      }
      const itineraries = list.map((it: any) => ({
        id: String(it.itineraryId != null ? it.itineraryId : it.id),
        title: it.itineraryName || it.title || '未命名旅途',
        days: it.days || (Array.isArray(it.daysList) ? it.daysList.length : 0),
      }));
      // 关闭介绍抽屉，打开选择面板（introContext 保留）
      this.setData({
        showIntroDrawer: '',
        introData: null,
        addFlow: {
          visible: true,
          step: 'itinerary',
          title: '选择要加入的行程',
          itineraries,
          days: [],
          chosenItineraryId: '',
          chosenDay: 0,
        },
      });
    },

    onAddFlowClose() {
      this.setData({ 'addFlow.visible': false });
    },

    onPickItinerary(e: any) {
      const id = e.currentTarget.dataset.id;
      const it = (this.data.addFlow.itineraries || []).find(
        (x: any) => String(x.id) === String(id),
      );
      if (!it) return;
      const days = Array.from({ length: it.days || 0 }, (_, i) => ({
        dayNumber: i + 1,
        label: `第${i + 1}天`,
      }));
      this.setData({
        'addFlow.chosenItineraryId': id,
        'addFlow.days': days,
        'addFlow.step': 'day',
        'addFlow.title': '选择第几天',
      });
    },

    onPickDay(e: any) {
      const dayNumber = Number(e.currentTarget.dataset.day);
      const ctx = this.data.introContext || {};
      if (ctx.type === 'dish') {
        this.setData({
          'addFlow.chosenDay': dayNumber,
          'addFlow.step': 'meal',
          'addFlow.title': '选择餐次',
        });
        return;
      }
      (this as any).performAdd(dayNumber, null);
    },

    onPickMeal(e: any) {
      const meal = e.currentTarget.dataset.meal;
      (this as any).performAdd(this.data.addFlow.chosenDay, meal);
    },

    async performAdd(dayNumber: number, meal: string | null) {
      const ctx = this.data.introContext || {};
      const itineraryId = Number(this.data.addFlow.chosenItineraryId);
      if (!itineraryId || !dayNumber) return;
      wx.showLoading({ title: '添加中', mask: true });
      try {
        if (ctx.type === 'attraction') {
          await updateDayAttractions({
            itineraryId,
            dayNumber,
            attractionIds: String(ctx.attractionId),
            replace: false,
          });
        } else if (ctx.type === 'checkin') {
          if (!ctx.attractionId) {
            wx.hideLoading();
            wx.showToast({ title: '该打卡点暂不支持添加', icon: 'none' });
            this.setData({ 'addFlow.visible': false });
            return;
          }
          await updateDayAttractions({
            itineraryId,
            dayNumber,
            attractionIds: String(ctx.attractionId),
            replace: false,
          });
        } else if (ctx.type === 'dish') {
          // 保留当天其它两餐的游客选择，仅替换所选餐次
          const detail = await getItinerary(itineraryId);
          const day = ((detail.data && detail.data.daysList) || []).find(
            (d: any) => d.dayNumber === dayNumber,
          );
          if (!day) {
            // 找不到当天数据则中止，避免把其它两餐清空
            wx.hideLoading();
            wx.showToast({ title: '未找到当天日程，请重试', icon: 'none' });
            this.setData({ 'addFlow.visible': false });
            return;
          }
          const params: any = {
            itineraryId,
            dayNumber,
            breakfastId: day.touristBreakfastId ?? undefined,
            lunchId: day.touristLunchId ?? undefined,
            dinnerId: day.touristDinnerId ?? undefined,
          };
          if (meal === 'breakfast') params.breakfastId = ctx.diningId;
          else if (meal === 'lunch') params.lunchId = ctx.diningId;
          else if (meal === 'dinner') params.dinnerId = ctx.diningId;
          await updateDayDining(params);
        }
        wx.hideLoading();
        wx.showToast({ title: '已添加到行程', icon: 'success' });
        this.setData({ 'addFlow.visible': false, introContext: null });
        (this as any).loadJourneys();
      } catch (err) {
        wx.hideLoading();
        console.error('add to itinerary failed:', err);
        wx.showToast({ title: '添加失败，请重试', icon: 'none' });
      }
    },

    /* -------------------- 其它 -------------------- */
    onViewAll() {
      wx.navigateTo({ url: '/pages/journeys/index' });
    },
    async onAddTrip() {
      const ok = await ensurePrivacyAgreed();
      if (!ok) return;
      const logged = await ensureLogin();
      if (!logged) return;
      wx.navigateTo({ url: '/pages/create-itinerary/index' });
    },
  },
});
