Component({
  properties: {
    title: {
      type: String,
      value: '地道灵感：探索秘境',
    },
    cards: {
      type: Array,
      value: [],
    },
  },
  methods: {
    onCardTap(e: any) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('cardtap', { id })
    },
  },
})