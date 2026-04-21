export enum ScopeEnums {
  record = 'scope.record',
  writePhotosAlbum = 'scope.writePhotosAlbum',
  camera = 'scope.camera',
}

export async function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (!res.code) {
          reject(new Error('wx login no code'));
          return;
        }
        resolve(res.code);
      },
      fail: reject,
    });
  });
}

export async function checkAuthorize(scope: string): Promise<boolean> {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => resolve(!!res.authSetting[scope as keyof WechatMiniprogram.AuthSetting]),
      fail: () => resolve(false),
    });
  });
}

export const hasRecordAuthorize = () => checkAuthorize(ScopeEnums.record);

export async function authorize(scope: string): Promise<void> {
  const has = await checkAuthorize(scope);
  if (!has) {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope,
        success: () => resolve(),
        fail: reject,
      });
    });
  }
}

export const requestRecordAuthorize = () => authorize(ScopeEnums.record);

module.exports = { ScopeEnums, wxLogin, checkAuthorize, hasRecordAuthorize, authorize, requestRecordAuthorize };
