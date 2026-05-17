/**
 * 地图路线服务单元测试。
 *
 * 通过转译真实 TypeScript 服务并 mock wx.request，验证腾讯地图路线 polyline 的解码行为。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../../');
const typescript = require(path.join(ROOT, 'node_modules/typescript'));

function loadMapService(wxMock) {
  const source = fs.readFileSync(
    path.join(ROOT, 'miniprogram/services/map.ts'),
    'utf-8',
  );
  const transpiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
    },
  }).outputText;

  const sandbox = {
    exports: {},
    wx: wxMock,
    console,
  };
  vm.runInNewContext(transpiled, sandbox, {
    filename: 'miniprogram/services/map.ts',
  });
  return sandbox.exports;
}

describe('[Unit] 地图路线服务', () => {
  test('多点路线应请求腾讯步行路线接口', async () => {
    const requestedUrls = [];
    const wxMock = {
      request(options) {
        requestedUrls.push(options.url);
        options.success({
          data: {
            status: 0,
            message: 'Success',
            result: {
              routes: [{
                polyline: [
                  28.44433,
                  119.486155,
                  -44,
                  1442,
                ],
              }],
            },
          },
        });
      },
    };
    const { getMultiStopRoute } = loadMapService(wxMock);

    await getMultiStopRoute([
      { latitude: 28.44422, longitude: 119.48615 },
      { latitude: 28.440347, longitude: 119.47595 },
    ]);

    expect(requestedUrls).toEqual([
      'https://apis.map.qq.com/ws/direction/v1/walking/',
    ]);
  });

  test('腾讯地图返回度单位 polyline 时不应再次除以 1e6', async () => {
    const wxMock = {
      request(options) {
        options.success({
          data: {
            status: 0,
            message: 'Success',
            result: {
              routes: [{
                polyline: [
                  28.44433,
                  119.486155,
                  -44,
                  1442,
                  -27,
                  1351,
                ],
              }],
            },
          },
        });
      },
    };
    const { getWalkingRoute } = loadMapService(wxMock);

    const result = await getWalkingRoute(
      { latitude: 28.44422, longitude: 119.48615 },
      { latitude: 28.440347, longitude: 119.47595 },
    );

    expect(result.points[0]).toEqual({
      latitude: 28.44433,
      longitude: 119.486155,
    });
    expect(result.points[1].latitude).toBeCloseTo(28.444286, 6);
    expect(result.points[1].longitude).toBeCloseTo(119.487597, 6);
  });
});
