import { wxLogin } from '@/utils/authorize';
import { login } from '@/services/auth';
import { TOKEN_KEY } from '@/utils/request';

Page({
  data: {
    loading: false,
    agreed: false,
    code: '',
  },

  onLoad() {
    this.fetchLoginCode();
  },

  async fetchLoginCode() {
    try {
      const code = await wxLogin();
      this.setData({ code });
    } catch (err) {
      console.error('Failed to get login code:', err);
    }
  },

  toggleAgreed() {
    this.setData({ agreed: !this.data.agreed });
  },

  onShowUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用18线旅行服务。本协议约定您与18线之间关于使用本平台服务的权利义务。使用本服务即表示您同意遵守本协议条款。我们将为您提供行程规划、本地服务推荐等功能，您应合法合规使用本平台服务。',
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  onShowPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '18线重视您的隐私保护。我们会收集您的微信授权信息（头像、昵称）、位置信息用于行程规划和本地服务推荐。您的信息将被加密存储，不会未经授权提供给第三方。您可随时在设置中管理授权或申请删除个人数据。',
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  async handleLogin() {
    if (this.data.loading) return;

    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      let { code } = this.data;
      if (!code) {
        code = await wxLogin();
      }
      const result = await login({ code });
      const token = (result as any)?.data?.token;

      if (token) {
        wx.setStorageSync(TOKEN_KEY, token);
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
        this.fetchLoginCode();
      }
    } catch (err) {
      console.error('Login error:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      this.fetchLoginCode();
    } finally {
      this.setData({ loading: false });
    }
  },
});
