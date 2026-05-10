Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    height: {
      type: String,
      value: '60vh',
    },
  },
  methods: {
    onMaskTap() {
      this.triggerEvent('close')
    },
    noop() {},
  },
})
