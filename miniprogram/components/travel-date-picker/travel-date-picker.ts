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
    /**
     * 'range'（缺省）= 开始 + 结束日期，两者都必填，行为与改造前**逐字节一致**；
     * 'single' = 只选一个出行日期，且**非必填**——额外提供「暂不选择日期」，
     *            点它同样 triggerEvent('confirm')，只是 startDate 为空串，由页面转 null。
     *            达人路线「用这条路线创建行程」用的就是这个模式（契约 W5 travelDate 非必填）。
     */
    mode: {
      type: String,
      value: 'range',
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
      if (this.data.mode === 'single') {
        this.confirmSingle();
        return;
      }

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

    /** single 模式：选了日期就走正常确认（不校验结束日期、不算天数区间） */
    confirmSingle() {
      const { draftStartDate } = this.data;
      if (!draftStartDate) {
        wx.showToast({ title: '请选择出行日期，或点「暂不选择日期」', icon: 'none' });
        return;
      }
      this.triggerEvent('confirm', {
        startDate: draftStartDate,
        endDate: '',
        startDateDisplay: formatDateDisplay(draftStartDate),
        endDateDisplay: '',
        days: 1,
      });
    },

    /**
     * single 模式的「日期非必填」出口：**必须显式提供**，
     * 否则用户想跳过就只能点遮罩关闭，会以为「创建行程」坏了。
     */
    onSkipDate() {
      this.triggerEvent('confirm', {
        startDate: '',
        endDate: '',
        startDateDisplay: '',
        endDateDisplay: '',
        days: 0,
      });
    },
  },
});
