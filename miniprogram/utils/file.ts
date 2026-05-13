const docIcon = 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/icon-faq.svg';
const pdfIcon = 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/icon-faq.svg';
const txtIcon = 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/icon-faq.svg';
const xlsIcon = 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/icon-faq.svg';
const otherIcon = 'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/icon-faq.svg';

const ImageExtList = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
const VideoExtList = ['.mp4'];
const DocExtList = ['.doc', '.docx'];
const XlsExtList = ['.xls', '.xlsx'];
const PdfExtList = ['.pdf'];

const fileMIMEMap: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.mp4': 'video/mp4',
};

const fileIconMap: Record<string, string> = {
  '.doc': docIcon,
  '.docx': docIcon,
  '.pdf': pdfIcon,
  '.txt': txtIcon,
  '.xls': xlsIcon,
  '.xlsx': xlsIcon,
};

export function getExtname(filename: string = '') {
  if (!filename) return '';
  const names = filename.split('.');
  return `.${names[names.length - 1].toLowerCase()}`;
}

export function getFileIcon(filename: string = '') {
  return fileIconMap[getExtname(filename)] || otherIcon;
}

export function getFileMIME(filename: string = '') {
  return fileMIMEMap[getExtname(filename)] || '';
}

export function isImage(filename: string = '') {
  return ImageExtList.includes(getExtname(filename)) || filename.includes('data:image');
}

export function isVideo(filename: string = '') {
  return VideoExtList.includes(getExtname(filename));
}

export function isPdf(filename: string = '') {
  return PdfExtList.includes(getExtname(filename));
}

export function isDoc(filename: string = '') {
  return DocExtList.includes(getExtname(filename));
}

export function isXls(filename: string = '') {
  return XlsExtList.includes(getExtname(filename));
}

module.exports = {
  docIcon, pdfIcon, txtIcon, xlsIcon, otherIcon,
  ImageExtList, VideoExtList, DocExtList, XlsExtList, PdfExtList,
  getExtname, getFileIcon, getFileMIME, isImage, isVideo, isPdf, isDoc, isXls,
};
