import request from '../utils/request';
import type { OssCredential } from '../types/oss';
import type { AjaxResult } from '../types/common';

/** 获取OSS上传凭证 */
export const getOssCredential = () =>
  request<AjaxResult<OssCredential>>('/wx/oss/credential?bizType=attraction', {
    data: { bizType: 'attraction' },
  });
