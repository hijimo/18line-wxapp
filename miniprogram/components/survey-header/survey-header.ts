Component({
  properties: {
    step: {
      type: Number,
      value: 1,
    },
    totalSteps: {
      type: Number,
      value: 3,
    },
  },
  data: {
    statusBarHeight: 0,
  },
  lifetimes: {
    attached() {
      const sysInfo = wx.getSystemInfoSync()
      this.setData({ statusBarHeight: sysInfo.statusBarHeight || 0 })
    },
  },
  methods: {
    onBack() {
      this.triggerEvent('back')
    },
  },
})
