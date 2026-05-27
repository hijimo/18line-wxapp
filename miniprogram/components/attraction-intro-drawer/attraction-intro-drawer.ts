const ATTRACTION_INTRO_LOCATION_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#2D4B37"/></svg>',
  );

const ATTRACTION_INTRO_SHARE_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 20C14.1667 20 13.4583 19.7083 12.875 19.125C12.2917 18.5417 12 17.8333 12 17C12 16.9 12.025 16.6667 12.075 16.3L5.05 12.2C4.78333 12.45 4.475 12.6458 4.125 12.7875C3.775 12.9292 3.4 13 3 13C2.16667 13 1.45833 12.7083 0.875 12.125C0.291667 11.5417 0 10.8333 0 10C0 9.16667 0.291667 8.45833 0.875 7.875C1.45833 7.29167 2.16667 7 3 7C3.4 7 3.775 7.07083 4.125 7.2125C4.475 7.35417 4.78333 7.55 5.05 7.8L12.075 3.7C12.0417 3.58333 12.0208 3.47083 12.0125 3.3625C12.0042 3.25417 12 3.13333 12 3C12 2.16667 12.2917 1.45833 12.875 0.875C13.4583 0.291667 14.1667 0 15 0C15.8333 0 16.5417 0.291667 17.125 0.875C17.7083 1.45833 18 2.16667 18 3C18 3.83333 17.7083 4.54167 17.125 5.125C16.5417 5.70833 15.8333 6 15 6C14.6 6 14.225 5.92917 13.875 5.7875C13.525 5.64583 13.2167 5.45 12.95 5.2L5.925 9.3C5.95833 9.41667 5.97917 9.52917 5.9875 9.6375C5.99583 9.74583 6 9.86667 6 10C6 10.1333 5.99583 10.2542 5.9875 10.3625C5.97917 10.4708 5.95833 10.5833 5.925 10.7L12.95 14.8C13.2167 14.55 13.525 14.3542 13.875 14.2125C14.225 14.0708 14.6 14 15 14C15.8333 14 16.5417 14.2917 17.125 14.875C17.7083 15.4583 18 16.1667 18 17C18 17.8333 17.7083 18.5417 17.125 19.125C16.5417 19.7083 15.8333 20 15 20ZM15 18C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16C14.7167 16 14.4792 16.0958 14.2875 16.2875C14.0958 16.4792 14 16.7167 14 17C14 17.2833 14.0958 17.5208 14.2875 17.7125C14.4792 17.9042 14.7167 18 15 18ZM3 11C3.28333 11 3.52083 10.9042 3.7125 10.7125C3.90417 10.5208 4 10.2833 4 10C4 9.71667 3.90417 9.47917 3.7125 9.2875C3.52083 9.09583 3.28333 9 3 9C2.71667 9 2.47917 9.09583 2.2875 9.2875C2.09583 9.47917 2 9.71667 2 10C2 10.2833 2.09583 10.5208 2.2875 10.7125C2.47917 10.9042 2.71667 11 3 11ZM15 4C15.2833 4 15.5208 3.90417 15.7125 3.7125C15.9042 3.52083 16 3.28333 16 3C16 2.71667 15.9042 2.47917 15.7125 2.2875C15.5208 2.09583 15.2833 2 15 2C14.7167 2 14.4792 2.09583 14.2875 2.2875C14.0958 2.47917 14 2.71667 14 3C14 3.28333 14.0958 3.52083 14.2875 3.7125C14.4792 3.90417 14.7167 4 15 4Z" fill="#163422"/></svg>',
  );

const ATTRACTION_FEATURE_ICON_LEISURE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-5-7h10a5 5 0 0 1-10 0Z" fill="#2D4B37"/></svg>',
  );

const ATTRACTION_FEATURE_ICON_DURATION =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.5-8H14v2h-5.5V5h2v5Z" fill="#2D4B37"/></svg>',
  );

const ATTRACTION_FEATURE_ICON_FAMILY =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm10 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-5-2a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM3 9h4a2 2 0 0 1 2 2v6H1v-6a2 2 0 0 1 2-2Zm5.5 0h3a2 2 0 0 1 2 2v6h-7v-6a2 2 0 0 1 2-2Zm5.5 0h4a2 2 0 0 1 2 2v6h-8v-6a2 2 0 0 1 2-2Z" fill="#2D4B37"/></svg>',
  );

const ATTRACTION_FEATURE_ICON_COST =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-1-4h2v2H9v-2Zm0-10h2v2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H9v2h3v2H9v2H9v-2H8a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3V6H8V4h1Z" fill="#2D4B37"/></svg>',
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

type AttractionFeatureTag = {
  key: string;
  label: string;
  value: string;
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
  bestTime: string;
  badFactors: string;
  ticketPriceA: string;
  ticketPriceC: string;
  reservationRequired: string;
  tags: string[];
  featureTags: AttractionFeatureTag[];
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
    normalizeAttractionIntroText(source.openTime),
    normalizeAttractionIntroText(source.indoorOutdoor),
    normalizeAttractionIntroText(source.closedDay),
  ].filter(Boolean);
  const checkInPoints = normalizeCheckInPoints(source);
  const costText = formatAttractionCost(source);

  const featureTags: AttractionFeatureTag[] = [];
  const leisureRating = normalizeAttractionIntroText(source.leisureRating);
  if (leisureRating) {
    featureTags.push({
      key: 'leisure',
      label: '休闲指数',
      value: leisureRating,
    });
  }
  const visitDuration = normalizeAttractionIntroText(source.visitDuration);
  if (visitDuration) {
    featureTags.push({
      key: 'duration',
      label: '游玩时间',
      value: visitDuration,
    });
  }
  if (source.familyFriendly === 'Y' || source.familyFriendly === '1') {
    featureTags.push({
      key: 'family',
      label: '亲子游',
      value: '',
    });
  }
  const perCost = normalizeAttractionIntroText(source.perCost);
  if (perCost) {
    featureTags.push({
      key: 'cost',
      label: '人均消费',
      value: `¥${perCost}`,
    });
  }

  const bestTime = normalizeAttractionIntroText(source.specialPeriod);
  const badFactorsText = normalizeAttractionIntroText(source.badFactors);
  const ticketA = normalizeAttractionIntroText(source.ticketPriceA);
  const ticketC = normalizeAttractionIntroText(source.ticketPriceC);
  const reservationText = normalizeAttractionIntroText(source.reservationRequired);
  const hasReservation = reservationText === 'Y' || reservationText === '1' || (reservationText && reservationText !== 'N' && reservationText !== '0');

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
    bestTime,
    badFactors: badFactorsText,
    ticketPriceA: ticketA ? `¥${ticketA}` : '',
    ticketPriceC: ticketC ? `¥${ticketC}` : '',
    reservationRequired: hasReservation ? reservationText : '',
    tags,
    featureTags,
    checkInPoints,
    hasGallery: images.length > 0,
    hasDetails: Boolean(
      ratingText ||
        costText ||
        address ||
        description ||
        notes ||
        bestTime ||
        badFactorsText ||
        ticketA ||
        ticketC ||
        hasReservation ||
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
    source: {
      type: String,
      value: '',
    },
  },
  data: {
    viewModel: createAttractionIntroViewModel({}),
    iconUrls: {
      location: ATTRACTION_INTRO_LOCATION_ICON,
      share: ATTRACTION_INTRO_SHARE_ICON,
    },
    featureIcons: {
      leisure: ATTRACTION_FEATURE_ICON_LEISURE,
      duration: ATTRACTION_FEATURE_ICON_DURATION,
      family: ATTRACTION_FEATURE_ICON_FAMILY,
      cost: ATTRACTION_FEATURE_ICON_COST,
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
