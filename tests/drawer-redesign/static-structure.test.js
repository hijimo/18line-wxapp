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

const scheduleEntryDrawers = [
  'attraction-intro-drawer',
  'hotel-intro-drawer',
  'dining-intro-drawer',
  'car-intro-drawer',
  'photography-intro-drawer',
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

test('itinerary detail marks all intro drawers as schedule-origin', () => {
  const pageWxml = fs.readFileSync(
    path.resolve(__dirname, '../../miniprogram/pages/itinerary-detail/index.wxml'),
    'utf8',
  );

  for (const drawer of scheduleEntryDrawers) {
    const drawerTag = drawer.replace(/-drawer$/, '');
    const drawerBlock = pageWxml.match(
      new RegExp(`<${drawerTag}-drawer[\\s\\S]*?/>`),
    )?.[0] || '';

    assert.match(drawerBlock, /source="schedule"/);
  }
});

test('itinerary detail maps schedule drawer data to attractionName', () => {
  const pageTs = fs.readFileSync(
    path.resolve(__dirname, '../../miniprogram/pages/itinerary-detail/index.ts'),
    'utf8',
  );

  assert.match(pageTs, /function normalizeIntroDataWithAttractionName/);
  assert.match(pageTs, /dayData\?\.attractionList\?\.\[0\]\?\.attractionName/);
  assert.match(pageTs, /buildDiningIntroData\(data, meal, currentDayData\)/);
  assert.match(pageTs, /normalizeIntroDataWithAttractionName\(data, currentDayData\)/);
});

for (const drawer of scheduleEntryDrawers) {
  test(`${drawer} renders location text from attractionName`, () => {
    const wxml = readDrawer(drawer, 'wxml');
    const ts = readDrawer(drawer, 'ts');
    const classPrefix = drawer.replace('-drawer', '');

    assert.ok(
      wxml.includes(
        `${classPrefix}__location-text">{{viewModel.attractionName}}`,
      ),
    );
    assert.match(wxml, /wx:if="{{viewModel\.attractionName}}"/);
    assert.match(ts, /attractionName/);
  });
}

for (const drawer of scheduleEntryDrawers) {
  test(`${drawer} hides only the add-to-itinerary button for schedule-origin openings`, () => {
    const wxml = readDrawer(drawer, 'wxml');
    const ts = readDrawer(drawer, 'ts');

    assert.match(ts, /source:\s*{/);
    assert.match(ts, /type:\s*String/);
    assert.match(wxml, /wx:if="{{source !== 'schedule'}}"[\s\S]*?bindtap="onAddTap"/);
    assert.match(wxml, /open-type="share"/);
  });
}

for (const drawer of scheduleEntryDrawers) {
  test(`${drawer} gallery images can open preview from the tapped image`, () => {
    const wxml = readDrawer(drawer, 'wxml');
    const ts = readDrawer(drawer, 'ts');

    assert.match(ts, /previewImageList/);
    assert.match(ts, /onPreviewImageTap/);
    assert.match(wxml, /bindtap="onPreviewImageTap"[\s\S]*?data-index="0"/);
    assert.match(wxml, /bindtap="onPreviewImageTap"[\s\S]*?data-index="1"/);
    assert.match(wxml, /bindtap="onPreviewImageTap"[\s\S]*?data-index="2"/);
  });
}

test('hotel and attraction share icons match the dining drawer share icon', () => {
  const diningTs = readDrawer('dining-intro-drawer', 'ts');
  const hotelTs = readDrawer('hotel-intro-drawer', 'ts');
  const attractionTs = readDrawer('attraction-intro-drawer', 'ts');

  const diningPath = diningTs.match(/const DINING_INTRO_SHARE_ICON =[\s\S]*?<path d="([^"]+)"/)?.[1];
  const hotelPath = hotelTs.match(/const HOTEL_INTRO_SHARE_ICON =[\s\S]*?<path d="([^"]+)"/)?.[1];
  const attractionPath = attractionTs.match(/const ATTRACTION_INTRO_SHARE_ICON =[\s\S]*?<path d="([^"]+)"/)?.[1];

  assert.ok(diningPath);
  assert.equal(hotelPath, diningPath);
  assert.equal(attractionPath, diningPath);
});

test('add schedule drawer has per-tab keyword search and filtered rendering', () => {
  const wxml = readDrawer('add-schedule-drawer', 'wxml');
  const ts = readDrawer('add-schedule-drawer', 'ts');
  const scss = readDrawer('add-schedule-drawer', 'scss');

  assert.match(wxml, /class="keyword-search"/);
  assert.match(wxml, /bindinput="onKeywordInput"/);
  assert.match(wxml, /bindtap="onKeywordClear"/);
  assert.match(wxml, /filteredAttractionList/);
  assert.match(wxml, /filteredAccommodationList/);
  assert.match(wxml, /filteredDiningList/);
  assert.match(wxml, /filteredCarList/);
  assert.match(wxml, /filteredPhotographyList/);
  assert.match(wxml, /searchEmptyText/);

  assert.match(ts, /type ScheduleTabId/);
  assert.match(ts, /tabKeywords/);
  assert.match(ts, /SEARCH_FIELD_MAP/);
  assert.match(ts, /filterDrawerList/);
  assert.match(ts, /resetKeywordSearch/);
  assert.match(ts, /未找到与/);

  assert.match(scss, /\.keyword-search/);
  assert.match(scss, /keyword-search__field/);
});
