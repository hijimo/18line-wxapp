/**
 * 「当地」列表缓存：按 district 编码缓存首页三列表（探索秘境/隐匿之藏/地道风物），
 * 带 TTL 过期，避免切换 swiper 卡片时重复请求。
 *
 * 结构：wx storage 中每个 listType 存一份
 *   { [districtCode]: { data, timestamp } }
 */

const STORAGE_PREFIX = 'district_cache_';
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 分钟

export type DistrictListType = 'secret' | 'hidden' | 'food';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type CacheBucket<T> = Record<string, CacheEntry<T>>;

function storageKey(listType: DistrictListType): string {
  return STORAGE_PREFIX + listType;
}

function readBucket<T>(listType: DistrictListType): CacheBucket<T> {
  try {
    const raw = wx.getStorageSync(storageKey(listType));
    return raw && typeof raw === 'object' ? (raw as CacheBucket<T>) : {};
  } catch {
    return {};
  }
}

function writeBucket<T>(listType: DistrictListType, bucket: CacheBucket<T>) {
  try {
    wx.setStorageSync(storageKey(listType), bucket);
  } catch {
    // ignore storage failures — cache is best-effort
  }
}

/** 读取缓存；命中且未过期返回 data，否则返回 null */
export function getDistrictCache<T>(
  listType: DistrictListType,
  district: string,
  ttlMs: number = DEFAULT_TTL_MS,
): T | null {
  if (!district) return null;
  const bucket = readBucket<T>(listType);
  const entry = bucket[district];
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= ttlMs) {
    return null;
  }
  return entry.data;
}

/** 写入缓存 */
export function setDistrictCache<T>(
  listType: DistrictListType,
  district: string,
  data: T,
) {
  if (!district) return;
  const bucket = readBucket<T>(listType);
  bucket[district] = { data, timestamp: Date.now() };
  writeBucket(listType, bucket);
}

/** 清除指定类型（可选指定 district）的缓存 */
export function clearDistrictCache(listType: DistrictListType, district?: string) {
  if (!district) {
    writeBucket(listType, {});
    return;
  }
  const bucket = readBucket(listType);
  delete bucket[district];
  writeBucket(listType, bucket);
}
