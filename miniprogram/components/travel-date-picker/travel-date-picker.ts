function parseDate(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;
  return new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3]),
  );
}

function calculateDays(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parseInt(parts[1], 10)}.${parseInt(parts[2], 10)}`;
}

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '选择出行日期',
    },
    startDate: {
      type: String,
      value: '',
    },
    endDate: {
      type: String,
      value: '',
    },
  },

  data: {
    draftStartDate: '',
    draftEndDate: '',
    draftStartDateDisplay: '',
    draftEndDateDisplay: '',
  },

  observers: {
    'show,startDate,endDate'(show: boolean, startDate: string, endDate: string) {
      if (!show) return;
      this.setData({
        draftStartDate: startDate || '',
        draftEndDate: endDate || '',
        draftStartDateDisplay: formatDateDisplay(startDate || ''),
        draftEndDateDisplay: formatDateDisplay(endDate || ''),
      });
    },
  },

  methods: {
    onMaskTap() {
      this.triggerEvent('close');
    },

    noop() {},

    onStartDateChange(e: any) {
      const draftStartDate = e.detail.value;
      const { draftEndDate } = this.data;
      const updates: Record<string, string> = {
        draftStartDate,
        draftStartDateDisplay: formatDateDisplay(draftStartDate),
      };

      if (draftEndDate && calculateDays(draftStartDate, draftEndDate) <= 0) {
        updates.draftEndDate = '';
        updates.draftEndDateDisplay = '';
      }

      this.setData(updates);
    },

    onEndDateChange(e: any) {
      const draftEndDate = e.detail.value;
      this.setData({
        draftEndDate,
        draftEndDateDisplay: formatDateDisplay(draftEndDate),
      });
    },

    onConfirm() {
      const { draftStartDate, draftEndDate } = this.data;
      if (!draftStartDate || !draftEndDate) {
        wx.showToast({ title: '请选择出行日期', icon: 'none' });
        return;
      }

      const days = calculateDays(draftStartDate, draftEndDate);
      if (days <= 0) {
        wx.showToast({ title: '结束日期需晚于开始日期', icon: 'none' });
        return;
      }

      this.triggerEvent('confirm', {
        startDate: draftStartDate,
        endDate: draftEndDate,
        startDateDisplay: formatDateDisplay(draftStartDate),
        endDateDisplay: formatDateDisplay(draftEndDate),
        days,
      });
    },
  },
});
