Component({
  properties: {
    step: {
      type: Number,
      value: 1,
    },
  },
  methods: {
    onBack() {
      this.triggerEvent('back')
    },
    onNext() {
      this.triggerEvent('next')
    },
  },
})
