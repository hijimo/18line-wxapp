/**
 * 自包含 TS 加载器：用项目已安装的 typescript 把 .ts 源码转译为 CommonJS 后加载，
 * 供纯函数单元测试直接 require 小程序 TS 模块（无需额外安装 ts-jest）。
 *
 * 说明：`import type` 会被 typescript 转译时擦除，故不会真的去 require types 目录。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');
const ts = require('typescript');

/**
 * @param {string} relFromMiniprogram 相对 miniprogram 根目录的路径，如 'pages/index/home-mappers.ts'
 * @param {object} [globals] 注入到模块作用域的全局变量，如 { wx: {...} }
 */
function loadTs(relFromMiniprogram, globals = {}) {
  const abs = path.resolve(__dirname, '../../miniprogram', relFromMiniprogram);
  const src = fs.readFileSync(abs, 'utf8');
  const transpiled = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
      isolatedModules: true,
    },
    fileName: abs,
  }).outputText;

  const m = new Module(abs, module);
  m.filename = abs;
  m.paths = Module._nodeModulePaths(path.dirname(abs));

  const localRequire = (req) => m.require(req);
  const globalKeys = Object.keys(globals);
  const wrapperArgs = ['exports', 'require', 'module', '__filename', '__dirname', ...globalKeys];
  const fn = vm.runInThisContext(
    `(function(${wrapperArgs.join(',')}){${transpiled}\n})`,
    { filename: abs },
  );
  fn(m.exports, localRequire, m, abs, path.dirname(abs), ...globalKeys.map((k) => globals[k]));
  m.loaded = true;
  return m.exports;
}

module.exports = { loadTs };
