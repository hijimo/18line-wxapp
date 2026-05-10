Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onDetailTap() {
      this.triggerEvent('carddetail', { type: 'attraction', data: this.data.item })
    },
  },
})
