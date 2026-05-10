Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    data: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onClose() {
      this.triggerEvent('close')
    },
  },
})
