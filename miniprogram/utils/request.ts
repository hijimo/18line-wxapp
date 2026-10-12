const API_ORIGIN = 'https://18line-admin.asyncb.com/api'; // TODO: 配置你的API地址

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
  /**
   * 静默模式：请求失败时**不弹** toast，只抛错交给调用方自行处理。
   *
   * 用于「探测类」可选接口——例如行程详情页的达人鼓励入口探测（W6）。
   * 这类接口失败时页面有合理的降级形态（渲染空），弹 toast 反而是打扰用户；
   * 且后端未部署时会稳定 404，会污染**既有**页面的体验。
   * 默认 false，保持既有行为不变。
   */
  silent?: boolean;
}

const defaultOption: RequestOption = {
  method: 'GET',
  timeout: 60000,
};

/**
 * 剔除 data 中值为 undefined 的键。
 *
 * wx.request 对 GET 的 data 并不走 JSON.stringify，而是自行拼接 query string，
 * undefined 会被 String() 成字面量 "undefined" 真的发给后端：
 *   - 字符串参数会变成一次真实的模糊查询（例如 keyword=undefined 搜出 0 条，列表恒为空）
 *   - 数值参数会让 Spring 类型转换失败，直接返回 400
 * 因此在请求出口统一兜底，避免每个调用点都要记得手写条件拼装。
 *
 * 只剔除 undefined，**不动 null**：null 在部分编辑类接口里是「显式清空该字段」的语义，
 * 与「不传该字段」并不等价。仅做浅层处理，GET 的 query 只有顶层键会被序列化。
 */
const pruneUndefined = (data: any): any => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const result: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) result[key] = data[key];
  });
  return result;
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
              data: pruneUndefined(finalOption.data),
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
        if (!finalOption.silent) {
          wx.showToast({
            title: err.message || '接口异常',
            icon: 'none',
            duration: 3500,
          });
        }
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
    data: pruneUndefined(finalOption.data),
    header,
    timeout: 1000 * 60 * 5,
    enableChunked: true,
  } as any);
};

export default request;
