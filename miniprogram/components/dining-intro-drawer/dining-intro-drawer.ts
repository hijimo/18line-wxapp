import { previewImageList } from '../../utils/image-preview';

const DINING_INTRO_LOCATION_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#2D4B37"/></svg>',
  );

const DINING_INTRO_SHARE_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 20C14.1667 20 13.4583 19.7083 12.875 19.125C12.2917 18.5417 12 17.8333 12 17C12 16.9 12.025 16.6667 12.075 16.3L5.05 12.2C4.78333 12.45 4.475 12.6458 4.125 12.7875C3.775 12.9292 3.4 13 3 13C2.16667 13 1.45833 12.7083 0.875 12.125C0.291667 11.5417 0 10.8333 0 10C0 9.16667 0.291667 8.45833 0.875 7.875C1.45833 7.29167 2.16667 7 3 7C3.4 7 3.775 7.07083 4.125 7.2125C4.475 7.35417 4.78333 7.55 5.05 7.8L12.075 3.7C12.0417 3.58333 12.0208 3.47083 12.0125 3.3625C12.0042 3.25417 12 3.13333 12 3C12 2.16667 12.2917 1.45833 12.875 0.875C13.4583 0.291667 14.1667 0 15 0C15.8333 0 16.5417 0.291667 17.125 0.875C17.7083 1.45833 18 2.16667 18 3C18 3.83333 17.7083 4.54167 17.125 5.125C16.5417 5.70833 15.8333 6 15 6C14.6 6 14.225 5.92917 13.875 5.7875C13.525 5.64583 13.2167 5.45 12.95 5.2L5.925 9.3C5.95833 9.41667 5.97917 9.52917 5.9875 9.6375C5.99583 9.74583 6 9.86667 6 10C6 10.1333 5.99583 10.2542 5.9875 10.3625C5.97917 10.4708 5.95833 10.5833 5.925 10.7L12.95 14.8C13.2167 14.55 13.525 14.3542 13.875 14.2125C14.225 14.0708 14.6 14 15 14C15.8333 14 16.5417 14.2917 17.125 14.875C17.7083 15.4583 18 16.1667 18 17C18 17.8333 17.7083 18.5417 17.125 19.125C16.5417 19.7083 15.8333 20 15 20ZM15 18C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16C14.7167 16 14.4792 16.0958 14.2875 16.2875C14.0958 16.4792 14 16.7167 14 17C14 17.2833 14.0958 17.5208 14.2875 17.7125C14.4792 17.9042 14.7167 18 15 18ZM3 11C3.28333 11 3.52083 10.9042 3.7125 10.7125C3.90417 10.5208 4 10.2833 4 10C4 9.71667 3.90417 9.47917 3.7125 9.2875C3.52083 9.09583 3.28333 9 3 9C2.71667 9 2.47917 9.09583 2.2875 9.2875C2.09583 9.47917 2 9.71667 2 10C2 10.2833 2.09583 10.5208 2.2875 10.7125C2.47917 10.9042 2.71667 11 3 11ZM15 4C15.2833 4 15.5208 3.90417 15.7125 3.7125C15.9042 3.52083 16 3.28333 16 3C16 2.71667 15.9042 2.47917 15.7125 2.2875C15.5208 2.09583 15.2833 2 15 2C14.7167 2 14.4792 2.09583 14.2875 2.2875C14.0958 2.47917 14 2.71667 14 3C14 3.28333 14.0958 3.52083 14.2875 3.7125C14.4792 3.90417 14.7167 4 15 4Z" fill="#163422"/></svg>',
  );

type DiningIntroAttachment = {
  url?: string;
  fileUrl?: string;
};

type DiningDish = {
  dishName?: string;
  name?: string;
};

type DiningPathItem = {
  type?: 'attraction' | 'dining' | 'hotel';
  title?: string;
  meta?: string;
  active?: boolean;
};

type DiningIntroData = {
  diningName?: string;
  diningDesc?: string;
  diningTips?: string;
  address?: string;
  longitude?: number | string;
  latitude?: number | string;
  avgCost?: number | string;
  recommendRating?: number | string;
  parkingAvailable?: string;
  petFriendly?: string;
  attachments?: DiningIntroAttachment[];
  dishes?: DiningDish[];
  dishList?: DiningDish[];
  signatureDishes?: DiningDish[] | string[];
  featuredDishes?: DiningDish[] | string[];
  __meal?: string;
  __pathItems?: DiningPathItem[];
};

type DiningIntroViewModel = {
  title: string;
  ratingText: string;
  costText: string;
  images: string[];
  photoCountText: string;
  address: string;
  description: string;
  dishes: string[];
  pathItems: Required<DiningPathItem>[];
  tags: string[];
  hasGallery: boolean;
  hasDetails: boolean;
};

function normalizeDiningIntroText(value?: string | number) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function getDiningIntroAttachmentUrl(attachment?: DiningIntroAttachment) {
  return normalizeDiningIntroText(attachment?.url || attachment?.fileUrl);
}

function getDishName(item: DiningDish | string) {
  if (typeof item === 'string') return normalizeDiningIntroText(item);
  return normalizeDiningIntroText(item.dishName || item.name);
}

function splitDishText(value?: string) {
  return normalizeDiningIntroText(value)
    .split(/[、,，;；\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDishList(source: DiningIntroData) {
  const structured =
    source.dishes ||
    source.dishList ||
    source.signatureDishes ||
    source.featuredDishes ||
    [];
  const dishes = structured.map(getDishName).filter(Boolean);

  if (dishes.length) return dishes.slice(0, 3);

  return splitDishText(source.diningTips).slice(0, 3);
}

function getTags(source: DiningIntroData) {
  return [
    source.parkingAvailable === 'Y' ? '可停车' : '',
    source.petFriendly === 'Y' ? '宠物友好' : '',
  ].filter(Boolean);
}

function normalizePathItems(items?: DiningPathItem[]) {
  return (items || [])
    .map((item) => ({
      type: item.type || 'dining',
      title: normalizeDiningIntroText(item.title),
      meta: normalizeDiningIntroText(item.meta),
      active: Boolean(item.active),
    }))
    .filter((item) => item.title);
}

function createDiningIntroViewModel(data: DiningIntroData | null | undefined): DiningIntroViewModel {
  const source = data || {};
  const images = (source.attachments || [])
    .map(getDiningIntroAttachmentUrl)
    .filter(Boolean)
    .slice(0, 8);
  const ratingText = normalizeDiningIntroText(source.recommendRating);
  const costText = normalizeDiningIntroText(source.avgCost);
  const dishes = getDishList(source);
  const pathItems = normalizePathItems(source.__pathItems);
  const address = normalizeDiningIntroText(source.address);
  const description = normalizeDiningIntroText(source.diningDesc);
  const tags = getTags(source);

  return {
    title: normalizeDiningIntroText(source.diningName) || '餐饮详情',
    ratingText,
    costText: costText ? `¥${costText}/person` : '',
    images,
    photoCountText:
      images.length > 2 ? `+${Math.max(images.length - 2, 1)} Photos` : '',
    address,
    description,
    dishes,
    pathItems,
    tags,
    hasGallery: images.length > 0,
    hasDetails: Boolean(
      ratingText ||
        costText ||
        address ||
        description ||
        dishes.length ||
        pathItems.length ||
        tags.length,
    ),
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
    source: {
      type: String,
      value: '',
    },
  },
  data: {
    viewModel: createDiningIntroViewModel({}),
    iconUrls: {
      location: DINING_INTRO_LOCATION_ICON,
      share: DINING_INTRO_SHARE_ICON,
    },
  },
  observers: {
    data(value: DiningIntroData) {
      this.setData({ viewModel: createDiningIntroViewModel(value) });
    },
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    },
    onPreviewImageTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      previewImageList((this.data.viewModel as DiningIntroViewModel).images, index);
    },
    onLocationTap() {
      const dining = this.data.data as DiningIntroData;
      const latitude = Number(dining.latitude);
      const longitude = Number(dining.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        wx.showToast({ title: '暂无餐厅定位', icon: 'none' });
        return;
      }

      wx.openLocation({
        latitude,
        longitude,
        name: normalizeDiningIntroText(dining.diningName) || '餐厅位置',
        address: normalizeDiningIntroText(dining.address),
        scale: 16,
        fail: () => {
          wx.showToast({ title: '无法打开位置', icon: 'none' });
        },
      });
    },
    onAddTap() {
      this.triggerEvent('primarytap', { data: this.data.data });
      this.triggerEvent('close');
    },
    onBookTap() {
      this.triggerEvent('booktap', { data: this.data.data });
      wx.showToast({ title: '请联系商家预订', icon: 'none' });
    },
  },
});
