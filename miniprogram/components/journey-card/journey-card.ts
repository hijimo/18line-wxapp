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
  },
})
