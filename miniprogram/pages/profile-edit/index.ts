import { getUserInfo, updateProfile } from '../../services/auth';
import Uploader from '../../utils/Uploader';

Page({
  data: {
    avatarUrl: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/user-profile.png',
    nickname: '',
    role: '',
    birthYear: '',
    bio: '',
    preferences: [
      { id: 'nature', label: '自然风光', selected: true },
      { id: 'culture', label: '人文历史', selected: true },
      { id: 'food', label: '美食探店', selected: false },
      { id: 'adventure', label: '户外探险', selected: true },
      { id: 'photography', label: '摄影打卡', selected: false },
    ],
  },

  uploader: null as any,

  onLoad() {
    this.uploader = new Uploader();
    this.loadUserInfo();
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
    const preferences = this.data.preferences.map((item) => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });
    this.setData({ preferences });
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
      await updateProfile({
        nickname: nickname.trim(),
        avatarUrl,
        remark: bio,
      });
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

  onBack() {
    wx.navigateBack({ delta: 1 });
  },
});
