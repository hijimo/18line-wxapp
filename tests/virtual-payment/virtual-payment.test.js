/**
 * utils/virtual-payment.ts 的运行时单元测试。
 *
 * ## 为什么这个文件要自己编译 TS
 * 仓库既有单测（如 tests/profile-edit-preference.test.js）是「读源码文本 + 正则断言」，
 * 适合守结构约定。但打赏支付编排是**资金相关**逻辑，文本断言无法证明
 * 「取消不会被当成失败」「session_key 失效只重试一次」这类行为真的成立。
 * 所以这里先用 tsc 把被测文件编译到临时目录，再 stub 全局 wx 与 service 做真实调用。
 * 编译约 1 秒，整套 35 个用例在 2 秒内跑完。
 *
 * ## 覆盖的红线（对应设计文档 §6.1 / §11.1 / §12.1）
 * - signData 原样透传，不被二次序列化（否则 -15006 签名失效）
 * - 顶层只传 signData/paySig/signature，不多传 mode（官方参数表已核对）
 * - errCode=-2 用户取消是正常路径，不 reject、不轮询、不报错
 * - 支付成功 ≠ 打赏成功：必须轮询服务端，读到 '0'/'1' 判为 pending 而非 failed
 * - 4001 / -15007 重新登录后**只重试一次**，不无限重试放大后端压力
 * - 设备不支持时**完全不出网**下单
 * - 并发连点被模块级锁拦住，只产生一笔订单
 */
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const Module = require('module');

const repoRoot = path.resolve(__dirname, '../..');
const outDir = path.join(os.tmpdir(), '18line-wxapp-vp-test');

// ---------- 编译被测文件 ----------
// 必须在**模块顶层同步**完成：node:test 的 test() 回调是异步调度的，
// 若把编译放进 test() 里，下面顶层的 require 会先执行并因产物不存在而 MODULE_NOT_FOUND。
const entry = path.join(outDir, 'utils/virtual-payment.js');
fs.mkdirSync(outDir, { recursive: true });
try {
  execFileSync(
    process.execPath,
    [
      path.join(repoRoot, 'node_modules/typescript/bin/tsc'),
      'miniprogram/utils/virtual-payment.ts',
      // TS6 下命令行指定文件时默认不加载 tsconfig，需显式声明。
      // 代价是 typings 未加载会报「找不到 wx」并非零退出，
      // 但 **JS 产物照常生成**，所以这里只以产物存在与否判定成败。
      '--ignoreConfig',
      '--outDir', outDir,
      '--module', 'CommonJS',
      '--target', 'ES2020',
      '--skipLibCheck',
      '--esModuleInterop',
    ],
    { cwd: repoRoot, stdio: 'pipe' },
  );
} catch (err) {
  if (!fs.existsSync(entry)) {
    const detail = (err.stdout || '').toString() + (err.stderr || '').toString();
    throw new Error(`tsc 未生成编译产物，无法继续测试：\n${detail.slice(0, 800)}`);
  }
}

test('编译产物已生成', () => {
  assert.ok(fs.existsSync(entry), '未生成 utils/virtual-payment.js');
});

// ---------- stub 全局 wx ----------
const calls = { vpay: [], storage: {} };
let sysInfo = { platform: 'android', SDKVersion: '2.20.0' };
let canIUseResult = true;
let vpayBehavior = 'success';
let vpayFailCode = -1;
let loginCount = 0;

global.wx = {
  getSystemInfoSync: () => sysInfo,
  canIUse: () => canIUseResult,
  requestVirtualPayment: (opt) => {
    calls.vpay.push(opt);
    if (vpayBehavior === 'success') return opt.success && opt.success({ errMsg: 'ok' });
    if (vpayBehavior === 'cancel') return opt.fail && opt.fail({ errCode: -2, errMsg: 'cancel' });
    return opt.fail && opt.fail({ errCode: vpayFailCode, errMsg: 'fail' });
  },
  login: (opt) => { loginCount += 1; opt.success && opt.success({ code: 'stub-code' }); },
  getStorageSync: (k) => calls.storage[k],
  setStorageSync: (k, v) => { calls.storage[k] = v; },
  removeStorageSync: (k) => { delete calls.storage[k]; },
  showToast: () => {},
  showModal: () => {},
  request: () => {},
};

// ---------- 拦截 require 注入 mock service ----------
const mock = {
  createRewardOrder: async () => ({ data: null }),
  getRewardOrderStatus: async () => ({ data: null }),
  login: async () => ({ data: { token: 'new-token' } }),
};
const counter = { create: 0, status: 0, login: 0 };
const origLoad = Module._load;
Module._load = function (request) {
  if (request.endsWith('services/reward')) {
    return {
      createRewardOrder: async (p) => { counter.create += 1; return mock.createRewardOrder(p); },
      getRewardOrderStatus: async (o) => { counter.status += 1; return mock.getRewardOrderStatus(o); },
    };
  }
  if (request.endsWith('services/auth')) {
    return { login: async (p) => { counter.login += 1; return mock.login(p); } };
  }
  return origLoad.apply(this, arguments);
};

const vp = require(path.join(outDir, 'utils/virtual-payment.js'));

function reset() {
  calls.vpay = []; calls.storage = {}; loginCount = 0;
  counter.create = 0; counter.status = 0; counter.login = 0;
  sysInfo = { platform: 'android', SDKVersion: '2.20.0' };
  canIUseResult = true; vpayBehavior = 'success'; vpayFailCode = -1;
  mock.login = async () => ({ data: { token: 'new-token' } });
}

const GOOD_ORDER = {
  orderNo: 'O1',
  outTradeNo: 'R260928120000ABCDEF',
  signData: '{"offerId":"1","buyQuantity":1,"env":1,"currencyType":"CNY","productId":"rw-test-1fen","goodsPrice":1,"outTradeNo":"R260928120000ABCDEF","attach":"R260928120000ABCDEF","mode":"short_series_goods"}',
  paySig: 'PAY_SIG',
  signature: 'USER_SIG',
  mode: 'short_series_goods',
  tierName: '联调测试',
  actualPriceFen: 1,
};

// ==================== compareVersion ====================
test('compareVersion: 相等版本返回 0', () => {
  assert.equal(vp.compareVersion('2.19.2', '2.19.2'), 0);
});
test('compareVersion: 低于最低版本返回 -1', () => {
  assert.equal(vp.compareVersion('2.19.1', '2.19.2'), -1);
});
test('compareVersion: 高于最低版本返回 1', () => {
  assert.equal(vp.compareVersion('2.20.0', '2.19.2'), 1);
});
test('compareVersion: 位数不等时补零比较', () => {
  assert.equal(vp.compareVersion('2.19', '2.19.2'), -1);
});
test('compareVersion: 次版本号跨十位仍正确', () => {
  assert.equal(vp.compareVersion('2.9.0', '2.19.2'), -1);
});
test('compareVersion: 非法入参返回 0 而非抛错', () => {
  assert.equal(vp.compareVersion(undefined, '2.19.2'), 0);
});

// ==================== 能力判定 ====================
test('capability: android + 2.20.0 支持', () => {
  reset();
  const c = vp.checkVirtualPaymentCapability();
  assert.equal(c.supported, true);
  assert.equal(c.platform, 'android');
});
test('capability: devtools 不支持且提示用真机', () => {
  reset();
  sysInfo = { platform: 'devtools', SDKVersion: '3.0.0' };
  const c = vp.checkVirtualPaymentCapability();
  assert.equal(c.supported, false);
  assert.match(c.reason, /真机/);
});
test('capability: 未知 platform 不支持', () => {
  reset();
  sysInfo = { platform: 'mac', SDKVersion: '2.30.0' };
  assert.equal(vp.checkVirtualPaymentCapability().supported, false);
});
test('capability: 低版本但 canIUse=true 支持（官方兜底判定）', () => {
  reset();
  sysInfo = { platform: 'ios', SDKVersion: '2.18.0' };
  canIUseResult = true;
  assert.equal(vp.checkVirtualPaymentCapability().supported, true);
});
test('capability: 低版本且 canIUse=false 不支持', () => {
  reset();
  sysInfo = { platform: 'ios', SDKVersion: '2.18.0' };
  canIUseResult = false;
  assert.equal(vp.checkVirtualPaymentCapability().supported, false);
});
test('capability: getSystemInfoSync 抛错时降级为不支持而不崩', () => {
  reset();
  const orig = wx.getSystemInfoSync;
  wx.getSystemInfoSync = () => { throw new Error('boom'); };
  const c = vp.checkVirtualPaymentCapability();
  wx.getSystemInfoSync = orig;
  assert.equal(c.supported, false);
});

// ==================== 签名透传红线 ====================
test('红线: 顶层只传 signData/paySig/signature，不多传 mode', async () => {
  reset();
  await vp.requestVirtualPayment({ signData: GOOD_ORDER.signData, paySig: 'P', signature: 'S' });
  assert.equal(calls.vpay.length, 1);
  const keys = Object.keys(calls.vpay[0])
    .filter((k) => !['success', 'fail', 'complete'].includes(k))
    .sort();
  assert.deepEqual(keys, ['paySig', 'signData', 'signature']);
});
test('红线: signData 原样透传，未被二次序列化（防 -15006）', async () => {
  reset();
  await vp.requestVirtualPayment({ signData: GOOD_ORDER.signData, paySig: 'P', signature: 'S' });
  assert.equal(calls.vpay[0].signData, GOOD_ORDER.signData);
  assert.equal(typeof calls.vpay[0].signData, 'string');
});
test('红线: errCode=-2 用户取消按正常路径 resolve', async () => {
  reset();
  vpayBehavior = 'cancel';
  const r = await vp.requestVirtualPayment({ signData: 'x', paySig: 'P', signature: 'S' });
  assert.equal(r.cancelled, true);
});
test('其他失败码 reject 并携带 errCode 与可读文案', async () => {
  reset();
  vpayBehavior = 'fail';
  vpayFailCode = -15014;
  await assert.rejects(
    () => vp.requestVirtualPayment({ signData: 'x', paySig: 'P', signature: 'S' }),
    (e) => {
      assert.equal(e.errCode, -15014);
      assert.match(e.message, /生效/);
      return true;
    },
  );
});

// ==================== 轮询终态 ====================
test("轮询: status='2' 首次即返回，只查 1 次", async () => {
  reset();
  mock.getRewardOrderStatus = async () => ({ data: { orderStatus: '2', outTradeNo: 'X' } });
  const r = await vp.pollRewardOrderStatus('X', { intervalMs: 1, maxAttempts: 8 });
  assert.equal(r.orderStatus, '2');
  assert.equal(counter.status, 1);
});
test("轮询: status='0' 持续时查满次数并返回最后结果（不误判失败）", async () => {
  reset();
  mock.getRewardOrderStatus = async () => ({ data: { orderStatus: '0', outTradeNo: 'X' } });
  const r = await vp.pollRewardOrderStatus('X', { intervalMs: 1, maxAttempts: 5 });
  assert.equal(counter.status, 5);
  assert.equal(r.orderStatus, '0');
});
test("轮询: status='3' 已关闭时提前终止", async () => {
  reset();
  mock.getRewardOrderStatus = async () => ({ data: { orderStatus: '3', outTradeNo: 'X' } });
  await vp.pollRewardOrderStatus('X', { intervalMs: 1, maxAttempts: 8 });
  assert.equal(counter.status, 1);
});
test('轮询: 单次查询抛错不中断，后续成功仍返回', async () => {
  reset();
  let n = 0;
  mock.getRewardOrderStatus = async () => {
    n += 1;
    if (n === 1) throw new Error('网络抖动');
    return { data: { orderStatus: '2' } };
  };
  const r = await vp.pollRewardOrderStatus('X', { intervalMs: 1, maxAttempts: 5 });
  assert.equal(r.orderStatus, '2');
  assert.equal(counter.status, 2);
});

// ==================== 编排 ====================
test('编排: 设备不支持时完全不出网下单', async () => {
  reset();
  sysInfo = { platform: 'devtools', SDKVersion: '3.0.0' };
  mock.createRewardOrder = async () => ({ data: GOOD_ORDER });
  const r = await vp.payLineReward({ lineId: 1, tierCode: 'T900' });
  assert.equal(r.status, 'unsupported');
  assert.equal(counter.create, 0);
  assert.equal(calls.vpay.length, 0);
});
test('编排: 下单 4002 功能未开时 failed 且不重试', async () => {
  reset();
  mock.createRewardOrder = async () => {
    const e = new Error('打赏功能暂未开放'); e.code = 4002; throw e;
  };
  const r = await vp.payLineReward({ lineId: 1, tierCode: 'T001' });
  assert.equal(r.status, 'failed');
  assert.equal(counter.create, 1);
  assert.match(r.message, /暂未开放/);
});
test('编排: 下单 4001 重新登录后重试一次并成功', async () => {
  reset();
  let first = true;
  mock.createRewardOrder = async () => {
    if (first) { first = false; const e = new Error('请先登录'); e.code = 4001; throw e; }
    return { data: GOOD_ORDER };
  };
  mock.getRewardOrderStatus = async () => ({ data: { orderStatus: '2', outTradeNo: GOOD_ORDER.outTradeNo } });
  const r = await vp.payLineReward({ lineId: 1, tierCode: 'T001' });
  assert.equal(r.status, 'success');
  assert.equal(counter.create, 2);
  assert.equal(counter.login, 1);
  assert.equal(calls.storage.token, 'new-token');
});
test('编排: 4001 且重登失败时不无限重试（create 仅 1 次）', async () => {
  reset();
  mock.login = async () => ({ data: {} });
  mock.createRewardOrder = async () => {
    const e = new Error('请先登录'); e.code = 4001; throw e;
  };
  const r = await vp.payLineReward({ lineId: 1, tierCode: 'T001' });
  assert.equal(r.status, 'failed');
  assert.equal(counter.create, 1);
  assert.equal(counter.login, 1);
});
test('编排: 支付阶段 -15007 重登后重新下单（签名依赖新 session_key）', async () => {
  reset();
  let first = true;
  mock.createRewardOrder = async () => ({ data: GOOD_ORDER });
  mock.getRewardOrderStatus = async () => ({ data: { orderStatus: '2', outTradeNo: GOOD_ORDER.outTradeNo } });
  const origVpay = wx.requestVirtualPayment;
  wx.requestVirtualPayment = (opt) => {
    calls.vpay.push(opt);
    if (first) { first = false; return opt.fail({ errCode: -15007, errMsg: 'expired' }); }
    return opt.success({ errMsg: 'ok' });
  };
  const r = await vp.payLineReward({ lineId: 1, tierCode: 'T001' });
  wx.requestVirtualPayment = origVpay;
  assert.equal(r.status, 'success');
  assert.equal(counter.create, 2);
  assert.equal(counter.login, 1);
});
test('编排: 用户取消返回 cancelled 且不触发轮询', async () => {
  reset();
  vpayBehavior = 'cancel';
  mock.createRewardOrder = async () => ({ data: GOOD_ORDER });
  const r = await vp.payLineReward({ lineId: 1, tierCode: 'T001' });
  assert.equal(r.status, 'cancelled');
  assert.equal(counter.status, 0);
});
test('编排: 支付成功且服务端已记账返回 success', async () => {
  reset();
  mock.createRewardOrder = async () => ({ data: GOOD_ORDER });
  mock.getRewardOrderStatus = async () => ({
    data: { orderStatus: '2', outTradeNo: GOOD_ORDER.outTradeNo, actualPriceFen: 1 },
  });
  const r = await vp.payLineReward({ lineId: 1, tierCode: 'T900' });
  assert.equal(r.status, 'success');
  assert.equal(r.order.actualPriceFen, 1);
});
test('编排: 下单返回缺 paySig 时 failed 且绝不调起支付', async () => {
  reset();
  mock.createRewardOrder = async () => ({ data: { ...GOOD_ORDER, paySig: '' } });
  const r = await vp.payLineReward({ lineId: 1, tierCode: 'T001' });
  assert.equal(r.status, 'failed');
  assert.equal(calls.vpay.length, 0);
});
test('编排: 并发连点被锁拦住，只产生一笔订单', async () => {
  reset();
  mock.createRewardOrder = async () => ({ data: GOOD_ORDER });
  mock.getRewardOrderStatus = async () => ({ data: { orderStatus: '2', outTradeNo: GOOD_ORDER.outTradeNo } });
  const [a, b] = await Promise.all([
    vp.payLineReward({ lineId: 1, tierCode: 'T001' }),
    vp.payLineReward({ lineId: 1, tierCode: 'T001' }),
  ]);
  assert.equal(counter.create, 1);
  assert.deepEqual([a.status, b.status].sort(), ['failed', 'success']);
});
test('编排: 下单入参携带正确的 platform 与 sdkVersion', async () => {
  reset();
  let seen = null;
  sysInfo = { platform: 'ios', SDKVersion: '2.21.0' };
  mock.createRewardOrder = async (p) => { seen = p; return { data: GOOD_ORDER }; };
  mock.getRewardOrderStatus = async () => ({ data: { orderStatus: '2', outTradeNo: 'X' } });
  await vp.payLineReward({ lineId: 7, tierCode: 'T010' });
  assert.deepEqual(seen, { lineId: 7, tierCode: 'T010', platform: 'ios', sdkVersion: '2.21.0' });
});
test('编排: onStage 按序回调四个阶段', async () => {
  reset();
  const stages = [];
  mock.createRewardOrder = async () => ({ data: GOOD_ORDER });
  mock.getRewardOrderStatus = async () => ({ data: { orderStatus: '2', outTradeNo: 'X' } });
  await vp.payLineReward({ lineId: 1, tierCode: 'T001', onStage: (s) => stages.push(s) });
  assert.deepEqual(stages, ['creating-order', 'invoking-payment', 'confirming', 'done']);
});

// ==================== 文案 ====================
test('文案: -2 取消用中性措辞而非报错语气', () => {
  assert.equal(vp.describeVirtualPaymentError(-2), '已取消');
});
test('文案: -15014 提示道具生效延迟', () => {
  assert.match(vp.describeVirtualPaymentError(-15014), /10 分钟/);
});
test('文案: 未收录错误码给兜底文案且不泄露原始码', () => {
  const m = vp.describeVirtualPaymentError(-99999);
  assert.doesNotMatch(m, /-99999/);
  assert.ok(m.length > 0);
});
test('文案: 业务码 4002/4003/4004 各有专属文案', () => {
  assert.match(vp.describeRewardBizError(4002), /暂未开放/);
  assert.match(vp.describeRewardBizError(4003), /不支持/);
  assert.match(vp.describeRewardBizError(4004), /版本过低/);
});
