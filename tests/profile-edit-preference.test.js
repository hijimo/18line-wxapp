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
  assert.match(ts, /addPreference\(\{ travelLikes \}\)/);
});

test('profile-edit keeps a stable empty state when preference dict loading fails', () => {
  const ts = readPage('ts');
  const wxml = readPage('wxml');

  assert.match(ts, /preferenceLoadFailed: true/);
  assert.match(wxml, /旅行偏好加载失败，请稍后重试/);
  assert.match(wxml, /暂无旅行偏好选项/);
});
