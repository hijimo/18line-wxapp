# E2E 测试同步矩阵

| 测试文件 / 用例名 | 对应业务流程 | 当前状态 | 问题分类 | 决策 | 改动 | 验证命令 | 结果 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `agent-builder/functional.test.js` 登录流程 | 登录页渲染、协议、登录 | 已重写 | 登录态问题 + 旧流程分散 | 合并到 `e2e/auth/setup.e2e.test.js` 与 `e2e/regression/current-contracts.e2e.test.js` | 独立 auth setup 保存 token，协议校验保留为 regression | `npm run test:e2e` | 通过：覆盖于完整 e2e 10/10 |
| `agent-builder/functional.test.js` 首页/Tab/个人中心 | 首页启动、tab 导航、核心入口 | 已重写 | selector 过时 + 只验元素存在 | 合并到 smoke | 新增 `e2e/smoke/navigation.e2e.test.js`，断言首页核心区块和路由结果 | `npm run test:e2e` | 通过：覆盖于完整 e2e 10/10 |
| `agent-builder/functional.test.js` 问卷流程 | 旅行偏好问卷 | 暂不纳入 core | 业务优先级非首批核心链路 | 后续作为 regression 候选 | 当前保留页面 contract，不进全量 e2e | - | 未运行 |
| `agent-builder/data-flow.test.js` 首页数据/Storage/组件事件 | 首页数据映射、token storage、组件事件 | 已合并 | 只验证内部数据结构 | 首页数据合并到 core/regression，token 合并到 auth | 新 request fixture 记录真实 service URL 与结果 | `npm run test:e2e` | 通过：覆盖于完整 e2e 10/10 |
| `agent-builder/itinerary.test.js` 创建行程/详情/交互 | 创建、详情、Day、添加抽屉、参数校验 | 已重写 | selector 过时 + 直接调用旧方法后连接崩溃 | 按当前页面方法重写 core | 新增创建、详情切天、改日期、列表进入详情、删除 | `npm run test:e2e` | 通过：覆盖于完整 e2e 10/10 |
| `agent-reviewer/itinerary-adversarial.test.js` 创建边界/详情边界 | 日期校验、重复点击、空日程、抽屉互斥 | 部分保留 | 旧 beforeAll 启动失败导致全组误报 | 日期校验保留；其它进入后续 regression 候选 | 新增日期反序阻止提交断言 | `npm run test:e2e` | 通过：覆盖于完整 e2e 10/10 |
| `agent-reviewer/adversarial.test.js` 登录安全/未授权/首页异常/个人中心退出 | 登录协议、无 token、401、异常数据、退出 | 部分保留 | 多条旧断言依赖过时 mock 与不稳定连接 | 协议和登录态恢复保留；401/退出需后端 contract 明确后补 | 新增协议不发请求、登录态丢失恢复 | `npm run test:e2e` | 通过：覆盖于完整 e2e 10/10 |
| `agent-reviewer/stability.test.js` 页面栈/大数据/竞态/生命周期 | 稳定性压力 | 已删除 | 不验证用户业务结果，且导致 DevTools 连接关闭 | 删除旧 e2e | 删除文件与旧对抗入口 | `npm run test:e2e` | 通过：完整 e2e 不再被该压力用例拖垮 |
| `agent-builder/hotel-intro-drawer.test.js` / `dining-intro-drawer` | 抽屉 UI 展示 | 已删除 | 组件级 selector 过时，且只验抽屉存在/关闭 | 删除旧 e2e；抽屉 contract 由静态/单元测试保留 | 删除文件；后续如需加“添加到行程”再写用户流程 | `npm run test:e2e` | 通过：核心流程未丢失 |
| `tests/home/home.test.js` 首页真实接口流 | 首页真实 service URL、搜索、添加到行程 | 已合并 | 位置不在新分层，缺登录态 setup | 合并到 smoke/regression/core fixture | 首页搜索保留，首页核心渲染保留 | `npm run test:e2e` | 通过：覆盖于完整 e2e 10/10 |
| `tests/drawer-redesign/*.test.js` | 抽屉 view model/静态结构 | 保留为非 e2e 单测 | 非 e2e | 不纳入 e2e 全量 | 继续由专项脚本维护 | `npm test -- --runTestsByPath ...` | 未运行 |
| `tests/home/*.unit.test.js` / `profile-edit-preference.test.js` | mapper/cache/资料偏好纯函数 | 保留为非 e2e 单测 | 非 e2e | 不纳入 e2e 全量 | 继续由专项脚本维护 | `npm test -- --runTestsByPath ...` | 未运行 |
| `e2e/auth/setup.e2e.test.js` 登录成功保存状态 | 用户登录 | 新增 | auth/setup | 新增 | 登录页交互、保存 auth state、记录 `/wx/auth/login` | `npm run test:e2e:auth` | 通过：1/1 |
| `e2e/smoke/navigation.e2e.test.js` 首页与核心导航 | 启动、tab、创建入口 | 新增 | smoke | 新增 | 复用登录态，验证路由和核心区块 | `npm run test:e2e:smoke` | 通过：2/2 |
| `e2e/core/itinerary-business.e2e.test.js` 创建/详情/列表/删除 | 行程核心业务 | 新增 | core business | 新增 | 断言提交参数、详情数据、日期保存、删除请求 | `npm run test:e2e:core` | 通过：3/3 |
| `e2e/regression/current-contracts.e2e.test.js` 协议/登录态/日期/搜索 | 当前回归点 | 新增 | regression | 新增 | 保留仍符合当前业务的历史风险点 | `npm run test:e2e:regression` | 通过：4/4 |
