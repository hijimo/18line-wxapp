export interface OssCredential {
  accessKeyId: string;
  policy: string;
  signature: string;
  uploadDir: string;
  host: string;
  expiration: string;
  duration: number;
  cdnDomain: string;
}
