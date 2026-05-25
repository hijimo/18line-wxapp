const ATTRACTION_INTRO_LOCATION_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#2D4B37"/></svg>',
  );

const ATTRACTION_INTRO_SHARE_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 20C14.1667 20 13.4583 19.7083 12.875 19.125C12.2917 18.5417 12 17.8333 12 17C12 16.9 12.025 16.6667 12.075 16.3L5.05 12.2C4.78333 12.45 4.475 12.6458 4.125 12.7875C3.775 12.9292 3.4 13 3 13C2.16667 13 1.45833 12.7083 0.875 12.125C0.291667 11.5417 0 10.8333 0 10C0 9.16667 0.291667 8.45833 0.875 7.875C1.45833 7.29167 2.16667 7 3 7C3.4 7 3.775 7.07083 4.125 7.2125C4.475 7.35417 4.78333 7.55 5.05 7.8L12.075 3.7C12.0417 3.58333 12.0208 3.47083 12.0125 3.3625C12.0042 3.25417 12 3.13333 12 3C12 2.16667 12.2917 1.45833 12.875 0.875C13.4583 0.291667 14.1667 0 15 0C15.8333 0 16.5417 0.291667 17.125 0.875C17.7083 1.45833 18 2.16667 18 3C18 3.83333 17.7083 4.54167 17.125 5.125C16.5417 5.70833 15.8333 6 15 6Z" fill="#163422"/></svg>',
  );

type AttractionIntroAttachment = {
  url?: string;
  fileUrl?: string;
};

type AttractionCheckInSource = {
  name?: string;
  title?: string;
  pointName?: string;
  description?: string;
  desc?: string;
  remark?: string;
  notes?: string;
  image?: string;
  imageUrl?: string;
  iconUrl?: string;
  url?: string;
  checked?: boolean;
  checkedIn?: boolean;
  isChecked?: boolean;
  status?: string | number;
  attachments?: AttractionIntroAttachment[];
};

type AttractionIntroData = {
  attractionName?: string;
  attractionShortName?: string;
  attractionDescription?: string;
  attractionBlurb?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  longitude?: number | string;
  latitude?: number | string;
  attractionNotes?: string;
  classicRating?: string | number;
  leisureRating?: string | number;
  visitDuration?: string;
  openTime?: string;
  familyFriendly?: string;
  ticketPriceA?: number | string;
  ticketPriceC?: number | string;
  reservationRequired?: string;
  perCost?: string | number;
  indoorOutdoor?: string;
  closedDay?: string;
  specialPeriod?: string;
  badFactors?: string;
  attractionType?: string;
  attachments?: AttractionIntroAttachment[];
  checkInPoints?: AttractionCheckInSource[];
  checkinPoints?: AttractionCheckInSource[];
  punchPoints?: AttractionCheckInSource[];
  clockInPoints?: AttractionCheckInSource[];
};

type AttractionCheckInPoint = {
  name: string;
  description: string;
  imageUrl: string;
  checked: boolean;
  statusText: string;
};

type AttractionIntroViewModel = {
  title: string;
  ratingText: string;
  costText: string;
  images: string[];
  photoCountText: string;
  address: string;
  description: string;
  notes: string;
  tags: string[];
  checkInPoints: AttractionCheckInPoint[];
  hasGallery: boolean;
  hasDetails: boolean;
};

function normalizeAttractionIntroText(value?: string | number) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function getAttractionIntroAttachmentUrl(attachment?: AttractionIntroAttachment) {
  return normalizeAttractionIntroText(attachment?.url || attachment?.fileUrl);
}

function isCheckInPointChecked(item: AttractionCheckInSource) {
  const status = normalizeAttractionIntroText(item.status).toLowerCase();
  return Boolean(
    item.checked ||
      item.checkedIn ||
      item.isChecked ||
      status === 'checked' ||
      status === 'done' ||
      status === 'y' ||
      status === '1',
  );
}

function getCheckInPointImage(item: AttractionCheckInSource) {
  return (
    normalizeAttractionIntroText(item.image) ||
    normalizeAttractionIntroText(item.imageUrl) ||
    normalizeAttractionIntroText(item.iconUrl) ||
    normalizeAttractionIntroText(item.url) ||
    getAttractionIntroAttachmentUrl(item.attachments?.[0])
  );
}

function normalizeCheckInPoints(source: AttractionIntroData) {
  const points =
    source.checkInPoints ||
    source.checkinPoints ||
    source.punchPoints ||
    source.clockInPoints ||
    [];

  return points
    .map((item, index) => {
      const checked = isCheckInPointChecked(item);
      return {
        name:
          normalizeAttractionIntroText(item.name || item.title || item.pointName) ||
          `打卡点 ${index + 1}`,
        description: normalizeAttractionIntroText(
          item.description || item.desc || item.remark || item.notes,
        ),
        imageUrl: getCheckInPointImage(item),
        checked,
        statusText: checked ? '已打卡' : '未打卡',
      };
    })
    .filter((item) => item.name);
}

function formatAttractionCost(source: AttractionIntroData) {
  const perCost = normalizeAttractionIntroText(source.perCost);
  if (perCost) return `¥${perCost}/person`;
  const adult = normalizeAttractionIntroText(source.ticketPriceA);
  const child = normalizeAttractionIntroText(source.ticketPriceC);
  if (adult && child) return `成人¥${adult} / 儿童¥${child}`;
  if (adult) return `门票¥${adult}`;
  if (child) return `儿童¥${child}`;
  return '';
}

function createAttractionIntroViewModel(
  data: AttractionIntroData | null | undefined,
): AttractionIntroViewModel {
  const source = data || {};
  const images = (source.attachments || [])
    .map(getAttractionIntroAttachmentUrl)
    .filter(Boolean)
    .slice(0, 8);
  const address =
    normalizeAttractionIntroText(source.address) ||
    [source.province, source.city, source.district]
      .map(normalizeAttractionIntroText)
      .filter(Boolean)
      .join('');
  const description =
    normalizeAttractionIntroText(source.attractionDescription) ||
    normalizeAttractionIntroText(source.attractionBlurb);
  const notes = normalizeAttractionIntroText(source.attractionNotes);
  const ratingText = normalizeAttractionIntroText(source.classicRating || source.leisureRating);
  const tags = [
    normalizeAttractionIntroText(source.attractionType),
    normalizeAttractionIntroText(source.visitDuration),
    normalizeAttractionIntroText(source.openTime),
    normalizeAttractionIntroText(source.indoorOutdoor),
    source.familyFriendly === 'Y' ? '亲子友好' : '',
    source.reservationRequired === 'Y' ? '需预约' : '',
    normalizeAttractionIntroText(source.closedDay),
    normalizeAttractionIntroText(source.specialPeriod),
    normalizeAttractionIntroText(source.badFactors),
  ].filter(Boolean);
  const checkInPoints = normalizeCheckInPoints(source);
  const costText = formatAttractionCost(source);

  return {
    title:
      normalizeAttractionIntroText(source.attractionShortName) ||
      normalizeAttractionIntroText(source.attractionName) ||
      '景点详情',
    ratingText,
    costText,
    images,
    photoCountText:
      images.length > 2 ? `+${Math.max(images.length - 2, 1)} Photos` : '',
    address,
    description,
    notes,
    tags,
    checkInPoints,
    hasGallery: images.length > 0,
    hasDetails: Boolean(
      ratingText ||
        costText ||
        address ||
        description ||
        notes ||
        tags.length ||
        checkInPoints.length,
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
  },
  data: {
    viewModel: createAttractionIntroViewModel({}),
    iconUrls: {
      location: ATTRACTION_INTRO_LOCATION_ICON,
      share: ATTRACTION_INTRO_SHARE_ICON,
    },
  },
  observers: {
    data(value: AttractionIntroData) {
      this.setData({ viewModel: createAttractionIntroViewModel(value) });
    },
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    },
    onLocationTap() {
      const attraction = this.data.data as AttractionIntroData;
      const latitude = Number(attraction.latitude);
      const longitude = Number(attraction.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        wx.showToast({ title: '暂无景点定位', icon: 'none' });
        return;
      }
      wx.openLocation({
        latitude,
        longitude,
        name: normalizeAttractionIntroText(attraction.attractionName) || '景点位置',
        address: normalizeAttractionIntroText(attraction.address),
        scale: 16,
      });
    },
    onAddTap() {
      this.triggerEvent('primarytap', { data: this.data.data });
      this.triggerEvent('close');
    },
    onRouteTap() {
      this.triggerEvent('routetap', { data: this.data.data });
      wx.showToast({ title: '可在地图中查看路线', icon: 'none' });
    },
  },
});
