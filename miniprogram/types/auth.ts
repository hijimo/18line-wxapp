export interface Tourist {
  touristId?: number;
  openid?: string;
  unionid?: string;
  sessionKey?: string;
  nickname?: string;
  avatarUrl?: string;
  gender?: string;
  phone?: string;
  realName?: string;
  idCard?: string;
  status?: string;
  delFlag?: string;
  loginIp?: string;
  loginDate?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export interface LoginParams {
  code: string;
  [key: string]: string;
}

export interface BindPhoneParams {
  encryptedData?: string;
  iv?: string;
  code?: string;
  [key: string]: string | undefined;
}

export interface LoginResult {
  token: string;
  tourist: Tourist;
}
