Component({
  properties: {
    journeys: {
      type: Array,
      value: [],
    },
  },
  methods: {
    onViewAll() {
      this.triggerEvent('viewall');
    },
    onCreateTrip() {
      wx.navigateTo({ url: '/pages/create-itinerary/index' });
    },
    onCardTap(e: any) {
      const id = e.currentTarget.dataset.id;
      if (!id) return;
      wx.navigateTo({ url: `/pages/itinerary-detail/index?id=${id}` });
    },
    // 切换卡片时上报当前索引与其 district；首页仅在 district 属于地址切换列表时才同步「当地」
    onSwiperChange(e: any) {
      const index = e.detail.current;
      const journeys = this.data.journeys || [];
      const active = journeys[index] || {};
      this.triggerEvent('change', { index, district: active.district || '' });
    },
  },
})
