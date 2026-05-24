Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    data: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onClose() {
      this.triggerEvent('close')
    },
    onPrimaryTap() {
      this.triggerEvent('primarytap', { data: this.data.data })
      this.triggerEvent('close')
    },
  },
})
