const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const test = require('node:test');

const pageRoot = path.resolve(__dirname, '../miniprogram/pages/profile-edit');

function readPage(ext) {
  return fs.readFileSync(path.join(pageRoot, `index.${ext}`), 'utf8');
}

test('profile-edit loads travel preferences from travel_tourist_like dict', () => {
  const ts = readPage('ts');

  assert.match(ts, /getDictByType\(TRAVEL_PREFERENCE_DICT_TYPE\)/);
  assert.match(ts, /TRAVEL_PREFERENCE_DICT_TYPE = 'travel_tourist_like'/);
  assert.doesNotMatch(ts, /id: 'nature'/);
  assert.doesNotMatch(ts, /id: 'culture'/);
});

test('profile-edit maps dict values to chip labels and selected values', () => {
  const ts = readPage('ts');
  const wxml = readPage('wxml');

  assert.match(ts, /dictValue/);
  assert.match(ts, /dictLabel/);
  assert.match(ts, /selectedPreferenceValues/);
  assert.match(wxml, /wx:for="{{preferences}}"/);
  assert.match(wxml, /data-id="{{item\.id}}"/);
  assert.match(wxml, /{{item\.label}}/);
});

test('profile-edit echoes and saves travelLikes dictionary values', () => {
  const ts = readPage('ts');

  assert.match(ts, /getLatestPreference/);
  assert.match(ts, /preference\.travelLikes/);
  assert.match(ts, /const travelLikes = selectedPreferenceValues\.join\(','\)/);
  assert.match(ts, /updatePreference\(\{[\s\S]*preferenceId,[\s\S]*travelLikes,/);
  assert.match(ts, /addPreference\(\{ travelLikes, birthYear: birthYearValue \}\)/);
});

test('profile-edit 回填角色与个人简介（来自 Tourist）', () => {
  const ts = readPage('ts');

  // 角色来自 tourist.role，个人简介存在 tourist.remark 上
  assert.match(ts, /role: tourist\.role \|\| ''/);
  assert.match(ts, /bio: tourist\.remark \|\| ''/);
  // 保存时同样要带上 role，否则回填的值会被清掉
  assert.match(ts, /role: role\.trim\(\)/);
  assert.match(ts, /remark: bio/);
});

test('profile-edit 回填出生年份（来自 Preference，数字转字符串）', () => {
  const ts = readPage('ts');

  // birthYear 在 Preference 上而非 Tourist，且后端是整型、picker 要字符串
  assert.match(ts, /birthYear: preference\.birthYear \? String\(preference\.birthYear\) : ''/);
  assert.match(ts, /Number\.parseInt\(String\(birthYear\)\.slice\(0, 4\), 10\)/);
  assert.match(ts, /Number\.isFinite\(parsedYear\) \? parsedYear : undefined/);
  assert.match(ts, /updatePreference\(\{[\s\S]*birthYear: birthYearValue,/);
  // 仅填年份、未选偏好时也要能新建记录
  assert.match(ts, /if \(travelLikes \|\| birthYearValue\)/);
});

test('mine 页角色不再是硬编码常量', () => {
  const mineTs = fs.readFileSync(
    path.resolve(__dirname, '../miniprogram/pages/mine/index.ts'),
    'utf8',
  );

  assert.match(mineTs, /'userInfo\.role': tourist\.role \|\| '首席探索官'/);
});

test('profile-edit keeps a stable empty state when preference dict loading fails', () => {
  const ts = readPage('ts');
  const wxml = readPage('wxml');

  assert.match(ts, /preferenceLoadFailed: true/);
  assert.match(wxml, /旅行偏好加载失败，请稍后重试/);
  assert.match(wxml, /暂无旅行偏好选项/);
});
