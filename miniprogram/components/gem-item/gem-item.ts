Component({
  properties: {
    item: {
      type: Object,
      value: {
        id: '',
        title: '',
        price: '',
        description: '',
        duration: '',
        distance: '',
        image: '',
      },
    },
  },
  methods: {
    onItemTap(e: any) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('itemtap', { id })
    },
  },
})