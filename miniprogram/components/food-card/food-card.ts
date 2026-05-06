Component({
  properties: {
    item: {
      type: Object,
      value: {
        id: '',
        name: '',
        tag: '',
        tagType: '',
        image: '',
      },
    },
  },
  methods: {
    onCardTap(e: any) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('cardtap', { id })
    },
  },
})