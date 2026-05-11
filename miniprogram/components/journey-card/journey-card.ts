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
  },
})
