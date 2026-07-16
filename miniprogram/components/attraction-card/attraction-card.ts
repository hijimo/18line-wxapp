Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
    index: {
      type: Number,
      value: 0,
    },
    unlocking: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    onDetailTap() {
      this.triggerEvent('carddetail', { type: 'attraction', data: this.data.item })
    },
    onDeleteTap() {
      this.triggerEvent('carddelete', { type: 'attraction', data: this.data.item })
    },
    onUnlockTap() {
      this.triggerEvent('unlock', { attractionId: this.data.item.attractionId })
    },
    onSkipTap() {
      this.triggerEvent('skip', { attractionId: this.data.item.attractionId })
    },
    onNavigateTap() {
      this.triggerEvent('navigate', {
        latitude: this.data.item.latitude,
        longitude: this.data.item.longitude,
        name: '神秘地点',
      })
    },
    onForceUnlockTap() {
      this.triggerEvent('forceunlock', { attractionId: this.data.item.attractionId })
    },
    updateSwipeState() {},
  },
})
