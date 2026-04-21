const USER_INFO_KEY = 'user_info';
const COMPANY_INFO_KEY = 'company_info';

export const getUserInfo = () => {
  return wx.getStorageSync(USER_INFO_KEY);
};

export const setUserInfo = (userInfo: any) => {
  wx.setStorageSync(USER_INFO_KEY, userInfo);
};

export const getCompanyInfo = () => {
  return wx.getStorageSync(COMPANY_INFO_KEY);
};

export const setCompanyInfo = (companyInfo: any) => {
  wx.setStorageSync(COMPANY_INFO_KEY, companyInfo);
};

module.exports = { getUserInfo, setUserInfo, getCompanyInfo, setCompanyInfo };
