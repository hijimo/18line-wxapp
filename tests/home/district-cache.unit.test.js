const { loadTs } = require('./ts-loader');

// 内存版 wx.storage mock
function makeWxMock() {
  const store = {};
  return {
    _store: store,
    getStorageSync(key) {
      return key in store ? store[key] : '';
    },
    setStorageSync(key, val) {
      store[key] = val;
    },
    removeStorageSync(key) {
      delete store[key];
    },
  };
}

describe('district-cache 单元测试', () => {
  test('set 后 get 命中返回数据', () => {
    const wx = makeWxMock();
    const C = loadTs('utils/district-cache.ts', { wx });
    C.setDistrictCache('secret', '331124', [{ id: 'a' }]);
    expect(C.getDistrictCache('secret', '331124')).toEqual([{ id: 'a' }]);
  });

  test('不同 district 互不干扰', () => {
    const wx = makeWxMock();
    const C = loadTs('utils/district-cache.ts', { wx });
    C.setDistrictCache('secret', '331124', [{ id: 'a' }]);
    expect(C.getDistrictCache('secret', '331125')).toBeNull();
  });

  test('TTL 过期返回 null', () => {
    const wx = makeWxMock();
    const C = loadTs('utils/district-cache.ts', { wx });
    C.setDistrictCache('food', '331124', [1, 2, 3]);
    // ttl=0 → 立即过期
    expect(C.getDistrictCache('food', '331124', 0)).toBeNull();
    // 足够大的 ttl → 命中
    expect(C.getDistrictCache('food', '331124', 60000)).toEqual([1, 2, 3]);
  });

  test('空 district 返回 null 且不写入', () => {
    const wx = makeWxMock();
    const C = loadTs('utils/district-cache.ts', { wx });
    C.setDistrictCache('hidden', '', [{ id: 'x' }]);
    expect(C.getDistrictCache('hidden', '')).toBeNull();
  });

  test('clearDistrictCache 清除指定 district', () => {
    const wx = makeWxMock();
    const C = loadTs('utils/district-cache.ts', { wx });
    C.setDistrictCache('secret', '331124', [{ id: 'a' }]);
    C.clearDistrictCache('secret', '331124');
    expect(C.getDistrictCache('secret', '331124')).toBeNull();
  });

  test('读到脏数据(非对象)安全回退', () => {
    const wx = makeWxMock();
    wx.setStorageSync('district_cache_secret', 'not-an-object');
    const C = loadTs('utils/district-cache.ts', { wx });
    expect(C.getDistrictCache('secret', '331124')).toBeNull();
  });
});
