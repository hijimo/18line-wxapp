Component({
  properties: {
    journeys: {
      type: Array,
      value: [],
    },
  },
  methods: {
    onViewAll() {
      this.triggerEvent('viewall')
    },
  },
})