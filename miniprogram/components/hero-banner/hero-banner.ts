Component({
  properties: {
    banners: {
      type: Array,
      value: [],
    },
  },
  methods: {
    onBannerTap(e: any) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('bannertap', { id })
    },
  },
})