const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const test = require('node:test');
const ts = require('typescript');
const vm = require('vm');

function loadImagePreviewUtils() {
  const filePath = path.resolve(__dirname, '../../miniprogram/utils/image-preview.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
  }).outputText;
  const calls = [];
  const sandbox = {
    module: { exports: {} },
    exports: {},
    wx: {
      previewImage(option) {
        calls.push(option);
      },
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(compiled, sandbox, { filename: filePath });

  return { ...sandbox.module.exports, calls };
}

test('previewImageList starts from the tapped valid image and keeps the current drawer list', () => {
  const { previewImageList, calls } = loadImagePreviewUtils();

  previewImageList(
    [
      'https://example.com/a.jpg',
      ' https://example.com/b.jpg ',
      '',
      'not-a-url',
      'wxfile://tmp/c.jpg',
    ],
    1,
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].current, 'https://example.com/b.jpg');
  assert.deepEqual(calls[0].urls, [
    'https://example.com/a.jpg',
    'https://example.com/b.jpg',
    'wxfile://tmp/c.jpg',
  ]);
});

test('previewImageList ignores empty or invalid current images', () => {
  const { previewImageList, calls } = loadImagePreviewUtils();

  previewImageList(['https://example.com/a.jpg', '', 'not-a-url'], 1);
  previewImageList(['https://example.com/a.jpg', '', 'not-a-url'], 2);
  previewImageList(null, 0);

  assert.equal(calls.length, 0);
});
