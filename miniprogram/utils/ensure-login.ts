import { wxLogin } from '@/utils/authorize';
import { login } from '@/services/auth';
import { TOKEN_KEY, getToken } from '@/utils/request';

const PRIVACY_KEY = 'privacyAgreed';

/**
 * 确保用户已登录。
 * 已有 token 直接返回 true；否则静默 wxLogin 取 code → 调后端登录 → 存 token。
 * 失败时 toast 提示并返回 false，不跳转 login 页（保持首页不打断）。
 */
export async function ensureLogin(): Promise<boolean> {
  const token = getToken();
  if (token) return true;

  try {
    const code = await wxLogin();
    const result = await login({ code });
    const newToken = (result as any)?.data?.token;
    if (newToken) {
      wx.setStorageSync(TOKEN_KEY, newToken);
      return true;
    }
    wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    return false;
  } catch (err) {
    console.error('ensureLogin failed:', err);
    wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    return false;
  }
}

/**
 * 确保用户已同意隐私条款。
 * 本地记忆：首次弹 wx.showModal，同意后写入 storage，后续不再打扰。
 */
export async function ensurePrivacyAgreed(): Promise<boolean> {
  const cached = wx.getStorageSync(PRIVACY_KEY);
  if (cached) return true;

  return new Promise((resolve) => {
    wx.showModal({
      title: '用户协议与隐私政策',
      content: '我们将依据《用户协议》和《隐私政策》为您提供服务，是否同意？',
      confirmText: '同意',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync(PRIVACY_KEY, { agreed: true, ts: Date.now() });
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: () => {
        resolve(false);
      },
    });
  });
}
