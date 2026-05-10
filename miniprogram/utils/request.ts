const API_ORIGIN = 'http://8.136.229.208:8080/api'; // TODO: 配置你的API地址

export const TOKEN_KEY = 'token';

const LOGIN_TIME_LIMIT = 2;

export const DEFAULT_PAGE_SIZE = 20;

export const getToken = () => {
  return wx.getStorageSync(TOKEN_KEY);
};

const codeMessage: Record<number, string> = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

interface RequestOption {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
  NO_TOKEN?: boolean;
}

const defaultOption: RequestOption = {
  method: 'GET',
  timeout: 60000,
};

const interceptorResponse = (
  response: WechatMiniprogram.RequestSuccessCallbackResult,
) => {
  const { data, statusCode } = response;

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(codeMessage[statusCode] || '网络异常');
  }

  const { msg, code } = (data as any) || {};

  if (code === 401 || code === 403) {
    wx.removeStorageSync(TOKEN_KEY);
    wx.showToast({
      title: code === 401 ? '登录已过期，请重新登录' : '无权限访问',
      icon: 'none',
      duration: 3000,
    });
    wx.redirectTo({ url: '/pages/login/index' });
    throw new Error(msg || '认证失败');
  }

  if (code !== 200) {
    const error: any = new Error(msg || '业务处理失败');
    error.code = code;
    throw error;
  }

  return data;
};

const request = async <T>(path: string, option?: RequestOption): Promise<T> => {
  const finalOption = { ...defaultOption, ...option };

  for (let loginTimes = 0; loginTimes < LOGIN_TIME_LIMIT; loginTimes++) {
    try {
      const ACCESS_TOKEN = wx.getStorageSync(TOKEN_KEY);
      const header: Record<string, string> = { ...finalOption.header };
      if (ACCESS_TOKEN) {
        header['sys-version'] = 'pre';
        header['Authorization'] = ACCESS_TOKEN;
      }

      const response =
        await new Promise<WechatMiniprogram.RequestSuccessCallbackResult>(
          (resolve, reject) => {
            wx.request({
              url: path.startsWith('http') ? path : `${API_ORIGIN}${path}`,
              method: finalOption.method,
              data: finalOption.data,
              header,
              timeout: finalOption.timeout,
              success: resolve,
              fail: reject,
            });
          },
        );

      return interceptorResponse(response) as T;
    } catch (err: any) {
      // 只对 401 重试（token 过期可能需要重新获取），其他错误直接抛出
      if (err.code !== 401 || loginTimes === LOGIN_TIME_LIMIT - 1) {
        wx.showToast({
          title: err.message || '接口异常',
          icon: 'none',
          duration: 3500,
        });
        throw err;
      }
    }
  }
  throw new Error('请求失败');
};

export const requestChunked = (path: string, option?: RequestOption) => {
  const finalOption = { ...defaultOption, ...option };
  const NO_TOKEN = finalOption.NO_TOKEN;

  const ACCESS_TOKEN = NO_TOKEN ? undefined : wx.getStorageSync(TOKEN_KEY);
  const header: Record<string, string> = { ...finalOption.header };
  if (ACCESS_TOKEN) {
    header['Authorization'] = ACCESS_TOKEN;
  }

  return wx.request({
    url: path.startsWith('http') ? path : `${API_ORIGIN}${path}`,
    method: finalOption.method,
    data: finalOption.data,
    header,
    timeout: 1000 * 60 * 5,
    enableChunked: true,
  } as any);
};

export default request;
