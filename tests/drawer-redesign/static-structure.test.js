const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const test = require('node:test');

const root = path.resolve(__dirname, '../../miniprogram/components');

function readDrawer(name, ext) {
  return fs.readFileSync(path.join(root, name, `${name}.${ext}`), 'utf8');
}

const drawers = [
  'car-intro-drawer',
  'hotel-intro-drawer',
  'photography-intro-drawer',
  'attraction-intro-drawer',
];

for (const drawer of drawers) {
  test(`${drawer} follows the dining drawer shell`, () => {
    const wxml = readDrawer(drawer, 'wxml');
    const classPrefix = drawer.replace('-drawer', '');

    assert.match(wxml, /height="86vh"/);
    assert.match(wxml, new RegExp(`${classPrefix}__hero`));
    assert.match(wxml, new RegExp(`${classPrefix}__heading`));
    assert.match(wxml, new RegExp(`${classPrefix}__gallery`));
    assert.match(wxml, new RegExp(`${classPrefix}__content`));
    assert.match(wxml, new RegExp(`${classPrefix}__actions`));
  });

  test(`${drawer} renders from a normalized viewModel`, () => {
    const ts = readDrawer(drawer, 'ts');

    assert.match(ts, /create/);
    assert.match(ts, /ViewModel/);
    assert.match(ts, /normalize/);
    assert.match(ts, /hasDetails/);
  });
}

test('attraction drawer has dedicated check-in point rendering', () => {
  const wxml = readDrawer('attraction-intro-drawer', 'wxml');
  const ts = readDrawer('attraction-intro-drawer', 'ts');

  assert.match(wxml, /checkin/);
  assert.match(wxml, /viewModel\.checkInPoints/);
  assert.match(ts, /checkInPoints/);
  assert.match(ts, /checked/);
});
