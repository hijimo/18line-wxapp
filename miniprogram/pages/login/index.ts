import { wxLogin } from '@/utils/authorize';
import { login } from '@/services/auth';
import { TOKEN_KEY } from '@/utils/request';

Page({
  data: {
    loading: false,
    agreed: false,
  },

  toggleAgreed() {
    this.setData({ agreed: !this.data.agreed });
  },

  async handleLogin() {
    if (this.data.loading) return;

    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const code = await wxLogin();
      const result = await login({ code });
      const token = (result as any)?.data?.token;

      if (token) {
        wx.setStorageSync(TOKEN_KEY, token);
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    } catch (err) {
      console.error('Login error:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
