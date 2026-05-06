Component({
  properties: {
    avatarUrl: {
      type: String,
      value: '/assets/images/user-profile.png',
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
    onBellTap() {
      this.triggerEvent('belltap')
    },
  },
})