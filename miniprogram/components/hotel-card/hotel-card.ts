const ACCOMMODATION_TYPE_MAP: Record<string, string> = {
  '0': '酒店',
  '1': '民宿',
};

Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },
  data: {
    typeLabel: '',
  },
  observers: {
    'item.accommodationType'(value: string) {
      const label = ACCOMMODATION_TYPE_MAP[value] || value || '';
      this.setData({ typeLabel: label });
    },
  },
  methods: {
    onDetailTap() {
      this.triggerEvent('carddetail', { type: 'hotel', data: this.data.item })
    },
    onDeleteTap() {
      this.triggerEvent('carddelete', { type: 'hotel', data: this.data.item })
    },
  },
})
