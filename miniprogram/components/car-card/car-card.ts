Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onDetailTap() {
      this.triggerEvent('carddetail', { type: 'car', data: this.data.item })
    },
    onDeleteTap() {
      this.triggerEvent('carddelete', { type: 'car', data: this.data.item })
    },
    updateSwipeState() {},
  },
})
