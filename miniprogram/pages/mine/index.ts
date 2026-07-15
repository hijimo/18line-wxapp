import { getUserInfo } from '../../services/auth';
import { getItineraryList } from '../../services/itinerary';
import { TOKEN_KEY } from '../../utils/request';

// 与 journeys 页保持一致：按日期判断待开始/进行中
function computePhase(startDate?: string, endDate?: string, days?: number) {
  const matched = (startDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return 'pending';
  const start = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start.getTime() > today.getTime()) return 'pending';
  const endMatched = (endDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  const end = endMatched
    ? new Date(Number(endMatched[1]), Number(endMatched[2]) - 1, Number(endMatched[3]))
    : days && days > 0
      ? new Date(start.getTime() + (days - 1) * 86400000)
      : null;
  if (end && end.getTime() < today.getTime()) return 'ended';
  return 'active';
}

Page({
  data: {
    userInfo: {
      avatarUrl: 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/user-profile.png',
      nickname: '林舒逸',
      role: '首席探索官',
    },
    journeyCount: {
      pending: 0,
      active: 0,
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
    this.loadJourneyCount();
  },

  async loadJourneyCount() {
    try {
      const res = await getItineraryList();
      const list = res.data || [];
      let pending = 0;
      let active = 0;
      list.forEach((item) => {
        const phase = computePhase(item.startDate, item.endDate, item.days);
        if (phase === 'pending') pending += 1;
        else if (phase === 'active') active += 1;
      });
      this.setData({ 'journeyCount.pending': pending, 'journeyCount.active': active });
    } catch (err) {
      console.error('Failed to load journey count:', err);
    }
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
