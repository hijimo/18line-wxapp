Component({
  properties: {
    currentTab: {
      type: String,
      value: 'explore',
    },
  },
  data: {
    tabs: [
      { id: 'explore', label: '探索', icon: '/assets/images/icon-tab-explore.svg', activeIcon: '/assets/images/icon-tab-explore.svg', active: true },
      { id: 'market', label: '集市', icon: '/assets/images/icon-tab-market.svg', activeIcon: '/assets/images/icon-tab-market.svg', active: false },
      { id: 'profile', label: '我的', icon: '/assets/images/icon-tab-profile.svg', activeIcon: '/assets/images/icon-tab-profile.svg', active: false },
    ],
  },
  observers: {
    currentTab(val: string) {
      const tabs = this.data.tabs.map((t: any) => ({ ...t, active: t.id === val }))
      this.setData({ tabs })
    },
  },
  methods: {
    onTabTap(e: any) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('tabchange', { id })
    },
  },
})