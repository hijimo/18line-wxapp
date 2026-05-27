import { previewImageList } from '../../utils/image-preview';

const PHOTOGRAPHY_INTRO_SHARE_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 20C14.1667 20 13.4583 19.7083 12.875 19.125C12.2917 18.5417 12 17.8333 12 17C12 16.9 12.025 16.6667 12.075 16.3L5.05 12.2C4.78333 12.45 4.475 12.6458 4.125 12.7875C3.775 12.9292 3.4 13 3 13C2.16667 13 1.45833 12.7083 0.875 12.125C0.291667 11.5417 0 10.8333 0 10C0 9.16667 0.291667 8.45833 0.875 7.875C1.45833 7.29167 2.16667 7 3 7C3.4 7 3.775 7.07083 4.125 7.2125C4.475 7.35417 4.78333 7.55 5.05 7.8L12.075 3.7C12.0417 3.58333 12.0208 3.47083 12.0125 3.3625C12.0042 3.25417 12 3.13333 12 3C12 2.16667 12.2917 1.45833 12.875 0.875C13.4583 0.291667 14.1667 0 15 0C15.8333 0 16.5417 0.291667 17.125 0.875C17.7083 1.45833 18 2.16667 18 3C18 3.83333 17.7083 4.54167 17.125 5.125C16.5417 5.70833 15.8333 6 15 6C14.6 6 14.225 5.92917 13.875 5.7875C13.525 5.64583 13.2167 5.45 12.95 5.2L5.925 9.3C5.95833 9.41667 5.97917 9.52917 5.9875 9.6375C5.99583 9.74583 6 9.86667 6 10C6 10.1333 5.99583 10.2542 5.9875 10.3625C5.97917 10.4708 5.95833 10.5833 5.925 10.7L12.95 14.8C13.2167 14.55 13.525 14.3542 13.875 14.2125C14.225 14.0708 14.6 14 15 14C15.8333 14 16.5417 14.2917 17.125 14.875C17.7083 15.4583 18 16.1667 18 17C18 17.8333 17.7083 18.5417 17.125 19.125C16.5417 19.7083 15.8333 20 15 20Z" fill="#163422"/></svg>',
  );

type PhotographyIntroAttachment = {
  url?: string;
  fileUrl?: string;
};

type PhotographyIntroData = {
  nickname?: string;
  gender?: string;
  introduction?: string;
  contactInfo?: string;
  price?: number | string;
  recommendRating?: number | string;
  equipment?: string;
  status?: string;
  attachments?: PhotographyIntroAttachment[];
};

type PhotographyIntroViewModel = {
  title: string;
  ratingText: string;
  costText: string;
  images: string[];
  photoCountText: string;
  contactInfo: string;
  description: string;
  serviceTags: string[];
  profileTags: string[];
  hasGallery: boolean;
  hasDetails: boolean;
};

function normalizePhotographyIntroText(value?: string | number) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function getPhotographyIntroAttachmentUrl(attachment?: PhotographyIntroAttachment) {
  return normalizePhotographyIntroText(attachment?.url || attachment?.fileUrl);
}

function createPhotographyIntroViewModel(
  data: PhotographyIntroData | null | undefined,
): PhotographyIntroViewModel {
  const source = data || {};
  const images = (source.attachments || [])
    .map(getPhotographyIntroAttachmentUrl)
    .filter(Boolean)
    .slice(0, 8);
  const price = normalizePhotographyIntroText(source.price);
  const ratingText = normalizePhotographyIntroText(source.recommendRating);
  const equipment = normalizePhotographyIntroText(source.equipment);
  const gender = normalizePhotographyIntroText(source.gender);
  const contactInfo = normalizePhotographyIntroText(source.contactInfo);
  const description = normalizePhotographyIntroText(source.introduction);
  const serviceTags = [equipment, ratingText ? `推荐指数 ${ratingText}` : ''].filter(Boolean);
  const profileTags = [gender ? `摄影师 ${gender}` : '', normalizePhotographyIntroText(source.status)].filter(Boolean);

  return {
    title: normalizePhotographyIntroText(source.nickname) || '跟拍详情',
    ratingText,
    costText: price ? `¥${price}` : '',
    images,
    photoCountText:
      images.length > 2 ? `+${Math.max(images.length - 2, 1)} Photos` : '',
    contactInfo,
    description,
    serviceTags,
    profileTags,
    hasGallery: images.length > 0,
    hasDetails: Boolean(
      ratingText ||
        price ||
        contactInfo ||
        description ||
        serviceTags.length ||
        profileTags.length,
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
    viewModel: createPhotographyIntroViewModel({}),
    iconUrls: {
      share: PHOTOGRAPHY_INTRO_SHARE_ICON,
    },
  },
  observers: {
    data(value: PhotographyIntroData) {
      this.setData({ viewModel: createPhotographyIntroViewModel(value) });
    },
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    },
    onPreviewImageTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      previewImageList((this.data.viewModel as PhotographyIntroViewModel).images, index);
    },
    onAddTap() {
      this.triggerEvent('primarytap', { data: this.data.data });
      this.triggerEvent('close');
    },
    onContactTap() {
      const viewModel = this.data.viewModel as PhotographyIntroViewModel;
      wx.showToast({
        title: viewModel.contactInfo ? `联系 ${viewModel.contactInfo}` : '暂无摄影师联系方式',
        icon: 'none',
      });
    },
  },
});
