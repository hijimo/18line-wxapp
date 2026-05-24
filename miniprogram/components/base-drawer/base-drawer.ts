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
    panelRadius: {
      type: String,
      value: '32rpx 32rpx 0 0',
    },
    panelBackground: {
      type: String,
      value: '#ffffff',
    },
    handleBackground: {
      type: String,
      value: '#e0e0e0',
    },
  },
  methods: {
    onMaskTap() {
      this.triggerEvent('close')
    },
    noop() {},
  },
})
