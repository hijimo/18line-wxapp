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
    /**
     * 只读模式：达人路线详情页一类的**浏览态**传 true。
     *
     * 效果：不渲染左滑删除区、不响应左滑手势、不渲染盲态操作按钮
     * （导航前往 / 我已到达 / 跳过 / 强制解锁）——那些是「行程进行中」的交互，
     * 浏览页放了会误导用户点了去调解锁接口（而这条行程根本不存在）。
     * 缺省 false，行程详情页等既有调用方行为完全不变。
     */
    readonly: {
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
        name: '小秘境',
      })
    },
    onForceUnlockTap() {
      this.triggerEvent('forceunlock', { attractionId: this.data.item.attractionId })
    },
    updateSwipeState() {},
  },
})
