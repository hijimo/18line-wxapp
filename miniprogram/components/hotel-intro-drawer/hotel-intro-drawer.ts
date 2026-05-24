type Attachment = {
  url?: string;
};

type HotelIntroData = {
  accommodationName?: string;
  accommodationType?: string;
  breakfastIncluded?: string;
  petFriendly?: string;
  priceMin?: number | string;
  priceMax?: number | string;
  address?: string;
  accommodationDesc?: string;
  attachments?: Attachment[];
};

type HotelIntroViewModel = {
  title: string;
  coverUrl: string;
  tags: string[];
  priceText: string;
  address: string;
  description: string;
  hasDetails: boolean;
};

function normalizeText(value?: string) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatPrice(min?: number | string, max?: number | string) {
  const minText = min === undefined || min === null || min === '' ? '' : String(min);
  const maxText = max === undefined || max === null || max === '' ? '' : String(max);

  if (minText && maxText && minText !== maxText) return `¥${minText} - ¥${maxText}`;
  if (minText) return `¥${minText} 起`;
  if (maxText) return `最高 ¥${maxText}`;
  return '';
}

function createViewModel(data: HotelIntroData | null | undefined): HotelIntroViewModel {
  const source = data || {};
  const coverUrl = normalizeText(source.attachments?.[0]?.url);
  const tags = [
    normalizeText(source.accommodationType),
    source.breakfastIncluded === 'Y' ? '含早餐' : '',
    source.petFriendly === 'Y' ? '可带宠物' : '',
  ].filter(Boolean);
  const priceText = formatPrice(source.priceMin, source.priceMax);
  const address = normalizeText(source.address);
  const description = normalizeText(source.accommodationDesc);

  return {
    title: normalizeText(source.accommodationName) || '住宿信息',
    coverUrl,
    tags,
    priceText,
    address,
    description,
    hasDetails: Boolean(tags.length || priceText || address || description),
  };
}

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
  data: {
    viewModel: createViewModel({}),
  },
  observers: {
    data(value: HotelIntroData) {
      this.setData({ viewModel: createViewModel(value) });
    },
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    },
  },
});
