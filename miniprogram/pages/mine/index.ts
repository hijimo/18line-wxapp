import { getUserInfo } from '../../services/auth';
import { TOKEN_KEY } from '../../utils/request';

Page({
  data: {
    userInfo: {
      avatarUrl: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/user-profile.png',
      nickname: '林舒逸',
      role: '首席探索官',
    },
    journeyCount: {
      pending: 3,
      cancelled: 0,
      completed: 0,
    },
    treasureCount: {
      pending: 2,
      cancelled: 0,
      completed: 0,
    },
  },

  onLoad() {
    // no-op
  },

  onShow() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    try {
      const res = await getUserInfo();
      const tourist = res.data;
      if (tourist) {
        this.setData({
          'userInfo.nickname': tourist.nickname || '林舒逸',
          'userInfo.avatarUrl': tourist.avatarUrl || 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/user-profile.png',
        });
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
    }
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/profile-edit/index' });
  },

  goJourneys(e: any) {
    const filter = e.currentTarget?.dataset?.filter || '';
    wx.navigateTo({ url: `/pages/journeys/index?filter=${filter}` });
  },

  goTravelTraits() {
    wx.navigateTo({ url: '/pages/survey/index?mode=edit' });
  },

  goFAQ() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync(TOKEN_KEY);
          wx.redirectTo({ url: '/pages/login/index' });
        }
      },
    });
  },

  onBellTap() {
    wx.showToast({ title: '暂无通知', icon: 'none' });
  },
});
