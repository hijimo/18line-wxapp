Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
    meal: {
      type: String,
      value: 'lunch',
    },
  },
  methods: {
    onDetailTap() {
      this.triggerEvent('carddetail', {
        type: 'dining',
        data: this.data.item,
        meal: this.data.meal,
      })
    },
    onDeleteTap() {
      this.triggerEvent('carddelete', {
        type: 'dining',
        data: this.data.item,
        meal: this.data.meal,
      })
    },
  },
})
