import { getOssCredential } from '../services/oss';

const KEY_UPLOAD_SIGN = '__upload_sign_object';

const genKey = (uploadDir: string, filename: string) => {
  return `${uploadDir}${filename}`;
};

const genFileUrl = (host: string, key: string) => `${host}/${key}`;

const defaultHeaders = () => ({ 'Cache-Control': 'max-age=31536000' });

export interface ISuccessResponse {
  data: string;
  statusCode: number;
}

export interface IUploadOption {
  url?: string;
  name?: string;
  header?: any;
  formData?: any;
  timeout?: number;
  onProgress?: (progress: number) => void;
  onError?: (msg?: string) => void;
  onSuccess?: (res: ISuccessResponse, fileUrl?: string) => void;
  complete?: () => void;
  filePath: string;
}

const getUploadUrl = (): string => '';
const getOssSign = async (): Promise<any> => {
  const res = await getOssCredential();
  return { success: true, data: res.data };
};

class Uploader {
  xhr: WechatMiniprogram.UploadTask | null = null;
  sign: any = null;
  useServerUrl: boolean;

  constructor(opts?: { useServerUrl?: boolean }) {
    this.useServerUrl = opts?.useServerUrl || false;
  }

  async getUploadSignInfo() {
    if (this.useServerUrl) {
      return { host: getUploadUrl() };
    }

    const sign = this.sign || wx.getStorageSync(KEY_UPLOAD_SIGN);
    if (sign && sign.expiration) {
      const expireTime = new Date(sign.expiration).getTime();
      if (expireTime - Date.now() > 60 * 1000) {
        return sign;
      }
    }

    const { success, data, retMsg }: any = await getOssSign();
    if (success) {
      wx.setStorageSync(KEY_UPLOAD_SIGN, data);
      return data;
    }
    throw Error(`获取证书失败：${retMsg}`);
  }

  async upload(option: IUploadOption) {
    this.sign = await this.getUploadSignInfo();
    if (!this.sign) return;

    const { header, formData, filePath, onSuccess, onError, onProgress } = option;
    const headers = Object.assign({}, header, defaultHeaders());
    const data = this.getFormData(filePath, formData);
    const { host } = this.sign;

    const progressCB = (res: WechatMiniprogram.UploadTaskOnProgressUpdateCallbackResult) => {
      if (onProgress) onProgress(res.progress);
    };

    this.xhr = wx.uploadFile({
      name: 'file',
      url: host,
      filePath,
      header: headers,
      formData: data,
      success: (res: WechatMiniprogram.UploadFileSuccessCallbackResult) => {
        if (onSuccess) {
          if (this.useServerUrl) {
            const responseData = JSON.parse(res.data);
            onSuccess(res, responseData?.data?.fileUrl);
          } else {
            onSuccess(res, data.fileUrl);
          }
        }
      },
      fail: () => {
        if (onError) onError();
      },
      complete: () => {
        if (this.xhr) this.xhr.offProgressUpdate(progressCB);
      },
    });
    this.xhr.onProgressUpdate(progressCB);
  }

  getFormData(filePath: string, formData?: any) {
    const { accessKeyId: OSSAccessKeyId, uploadDir, policy, signature, host } = this.sign;
    const filename = filePath.split('/').pop() || '';
    const key = genKey(uploadDir, filename);
    return {
      ...formData,
      OSSAccessKeyId,
      success_action_status: '200',
      policy,
      signature,
      key,
      fileUrl: genFileUrl(host, key),
    };
  }

  abort() {
    if (this.xhr) this.xhr.abort();
  }
}

export default Uploader;
