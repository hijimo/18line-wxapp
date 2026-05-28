import { getUserInfo, updateProfile } from '../../services/auth';
import { getDictByType } from '../../services/dict';
import { addPreference, getLatestPreference, updatePreference } from '../../services/preference';
import Uploader from '../../utils/Uploader';
import type { DictData } from '../../types/dict';

const TRAVEL_PREFERENCE_DICT_TYPE = 'travel_tourist_like';

interface TravelPreferenceOption {
  id: string;
  label: string;
  selected: boolean;
}

const parsePreferenceValues = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildPreferenceOptions = (
  dictList: DictData[],
  selectedValues: string[],
): TravelPreferenceOption[] => {
  const selectedSet = new Set(selectedValues);

  return dictList
    .filter((item) => item.dictLabel && item.dictValue)
    .map((item) => ({
      id: item.dictValue,
      label: item.dictLabel,
      selected: selectedSet.has(item.dictValue),
    }));
};

Page({
  data: {
    avatarUrl: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/user-profile.png',
    nickname: '',
    role: '',
    birthYear: '',
    bio: '',
    preferenceId: 0,
    selectedPreferenceValues: [] as string[],
    preferences: [] as TravelPreferenceOption[],
    preferenceLoadFailed: false,
  },

  uploader: null as any,

  onLoad() {
    this.uploader = new Uploader();
    this.loadUserInfo();
    this.loadTravelPreferenceOptions();
    this.loadExistingPreference();
  },

  async loadUserInfo() {
    try {
      const res = await getUserInfo();
      const tourist = res.data;
      if (tourist) {
        this.setData({
          avatarUrl: tourist.avatarUrl || 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/user-profile.png',
          nickname: tourist.nickname || '',
        });
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
    }
  },

  async loadTravelPreferenceOptions() {
    try {
      const res = await getDictByType(TRAVEL_PREFERENCE_DICT_TYPE);
      const preferences = buildPreferenceOptions(res.data || [], this.data.selectedPreferenceValues);

      this.setData({
        preferences,
        preferenceLoadFailed: false,
      });
    } catch (err) {
      console.error('Failed to load travel preference options:', err);
      this.setData({
        preferences: [],
        preferenceLoadFailed: true,
      });
    }
  },

  async loadExistingPreference() {
    try {
      const res = await getLatestPreference();
      const preference = res.data;
      if (!preference) return;

      const selectedPreferenceValues = parsePreferenceValues(preference.travelLikes);

      this.setData({
        preferenceId: preference.preferenceId || 0,
        selectedPreferenceValues,
        preferences: buildPreferenceOptions(
          this.data.preferences.map((item) => ({
            dictLabel: item.label,
            dictValue: item.id,
            dictType: TRAVEL_PREFERENCE_DICT_TYPE,
          })),
          selectedPreferenceValues,
        ),
      });
    } catch (err) {
      console.error('Failed to load existing travel preference:', err);
    }
  },

  onNicknameInput(e: any) {
    this.setData({ nickname: e.detail.value });
  },

  onRoleInput(e: any) {
    this.setData({ role: e.detail.value });
  },

  onBirthYearChange(e: any) {
    this.setData({ birthYear: e.detail.value });
  },

  onBioInput(e: any) {
    this.setData({ bio: e.detail.value });
  },

  togglePreference(e: any) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;

    const selectedPreferenceValues = this.data.selectedPreferenceValues.includes(id)
      ? this.data.selectedPreferenceValues.filter((item) => item !== id)
      : [...this.data.selectedPreferenceValues, id];
    const preferences = this.data.preferences.map((item) => ({
      ...item,
      selected: selectedPreferenceValues.includes(item.id),
    }));

    this.setData({ selectedPreferenceValues, preferences });
  },

  addPreference() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadAvatar(tempFilePath);
      },
    });
  },

  uploadAvatar(filePath: string) {
    wx.showLoading({ title: '上传中...' });
    this.uploader.upload({
      filePath,
      onSuccess: (_res: any, fileUrl?: string) => {
        wx.hideLoading();
        if (fileUrl) {
          this.setData({ avatarUrl: fileUrl });
          wx.showToast({ title: '头像已更新', icon: 'success' });
        }
      },
      onError: () => {
        wx.hideLoading();
        wx.showToast({ title: '上传失败', icon: 'none' });
      },
    });
  },

  async handleSave() {
    const { nickname, avatarUrl, bio } = this.data;

    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      await Promise.all([
        updateProfile({
          nickname: nickname.trim(),
          avatarUrl,
          remark: bio,
        }),
        this.saveTravelPreference(),
      ]);
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async saveTravelPreference() {
    const { preferenceId, selectedPreferenceValues } = this.data;
    const travelLikes = selectedPreferenceValues.join(',');

    if (preferenceId) {
      await updatePreference({
        preferenceId,
        travelLikes,
      });
      return;
    }

    if (travelLikes) {
      await addPreference({ travelLikes });
    }
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },
});
