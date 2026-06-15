Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onDetailTap() {
      this.triggerEvent('carddetail', { type: 'photography', data: this.data.item })
    },
    onDeleteTap() {
      this.triggerEvent('carddelete', { type: 'photography', data: this.data.item })
    },
  },
})
