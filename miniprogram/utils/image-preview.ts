const PREVIEWABLE_IMAGE_PREFIXES = ['http://', 'https://', 'wxfile://', 'cloud://', '/'];

function normalizeImageUrl(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export function getPreviewableImageUrls(images: unknown) {
  if (!Array.isArray(images)) return [];

  return images
    .map(normalizeImageUrl)
    .filter((url) => PREVIEWABLE_IMAGE_PREFIXES.some((prefix) => url.startsWith(prefix)));
}

export function previewImageList(images: unknown, currentIndex: number) {
  const sourceImages = Array.isArray(images) ? images : [];
  const current = normalizeImageUrl(sourceImages[currentIndex]);

  if (!current || !PREVIEWABLE_IMAGE_PREFIXES.some((prefix) => current.startsWith(prefix))) {
    return;
  }

  const urls = getPreviewableImageUrls(sourceImages);
  if (!urls.includes(current)) return;

  wx.previewImage({
    current,
    urls,
  });
}

module.exports = { getPreviewableImageUrls, previewImageList };
