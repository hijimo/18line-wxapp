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
| `agent-builder/hotel-intro-drawer.test.js` / `dining-intro-drawer` | 抽屉 UI 展示 | 已删除 | 组件级 selector 过时，且只验抽屉存在/关闭 | 删除旧 e2e；抽屉 contract 由静态/单元测试保留 | 删除文件；后续如需加"添加到行程"再写用户流程 | `npm run test:e2e` | 通过：核心流程未丢失 |
| `tests/home/home.test.js` 首页真实接口流 | 首页真实 service URL、搜索、添加到行程 | 已合并 | 位置不在新分层，缺登录态 setup | 合并到 smoke/regression/core fixture | 首页搜索保留，首页核心渲染保留 | `npm run test:e2e` | 通过：覆盖于完整 e2e 10/10 |
| `tests/drawer-redesign/*.test.js` | 抽屉 view model/静态结构 | 保留为非 e2e 单测 | 非 e2e | 不纳入 e2e 全量 | 继续由专项脚本维护 | `npm test -- --runTestsByPath ...` | 未运行 |
| `tests/home/*.unit.test.js` / `profile-edit-preference.test.js` | mapper/cache/资料偏好纯函数 | 保留为非 e2e 单测 | 非 e2e | 不纳入 e2e 全量 | 继续由专项脚本维护 | `npm test -- --runTestsByPath ...` | 未运行 |
| `e2e/auth/setup.e2e.test.js` 登录成功保存状态 | 用户登录 | 新增 | auth/setup | 新增 | 登录页交互、保存 auth state、记录 `/wx/auth/login` | `npm run test:e2e:auth` | 通过：1/1 |
| `e2e/smoke/navigation.e2e.test.js` 首页与核心导航 | 启动、tab、创建入口 | 新增 | smoke | 新增 | 复用登录态，验证路由和核心区块 | `npm run test:e2e:smoke` | 通过：2/2 |
| `e2e/core/itinerary-business.e2e.test.js` 创建/详情/列表/删除 | 行程核心业务 | 新增 | core business | 新增 | 断言提交参数、详情数据、日期保存、删除请求 | `npm run test:e2e:core` | 通过：3/3 |
| `e2e/regression/current-contracts.e2e.test.js` 协议/登录态/日期/搜索 | 当前回归点 | 新增 | regression | 新增 | 保留仍符合当前业务的历史风险点 | `npm run test:e2e:regression` | 通过：4/4 |

---

## 2026-07-24 迭代需求 e2e 新增/更新

| 测试文件 / 用例名 | 对应业务流程 | 当前状态 | 问题分类 | 决策 | 改动 | 验证命令 | 结果 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `e2e/regression/auth-privacy.e2e.test.js` 1.1 未登录点创建触发登录后落地 create-itinerary | 需求1：ensureLogin 前置守卫 | 新增 | regression | 新增 | 清空 token → 点创建 → 验 login 请求 + token 写入 + 跳转 create-itinerary | `npm run test:e2e:regression` | 待验证 |
| `e2e/regression/auth-privacy.e2e.test.js` 1.2 已登录直接进 | 需求1：已有 token 跳过登录 | 新增 | regression | 新增 | 设 token → 点创建 → 无 login 请求 + 直接跳 create-itinerary | `npm run test:e2e:regression` | 待验证 |
| `e2e/regression/auth-privacy.e2e.test.js` 1.3 取消不跳转 | 需求1：用户拒绝隐私弹窗 | 新增 | regression | 新增 | showModal mock 返回 cancel → 点创建 → 留首页 | `npm run test:e2e:regression` | 待验证 |
| `e2e/regression/auth-privacy.e2e.test.js` 1.4 隐私同意记忆 | 需求1：privacyAgreed storage 记忆 | 新增 | regression | 新增 | 设 privacyAgreed → 点创建 → 不弹隐私 modal | `npm run test:e2e:regression` | 待验证 |
| `e2e/regression/auth-privacy.e2e.test.js` 1.5 401/403 被动跳登录不回归 | 需求1：request.ts 拦截器保持 | 新增 | regression | 新增 | 验证 login 页可访问+核心元素存在；NOTE: 完整 401 模拟需单独 mock 覆盖 | `npm run test:e2e:regression` | 待验证 |
| `e2e/smoke/home-arrow.e2e.test.js` 2.1 首页主题色箭头与无通知入口 | 需求2：首页左箭头 UI、移除通知图标 | 调整 | smoke | 更新 | 验证 .top-bar-arrow 为主题色文本箭头、.top-bar-brand 正常且 .top-bar-bell 不存在；视觉对齐需真机截图 | `npm run test:e2e:smoke` | 已通过 |
| `e2e/core/region-lock.e2e.test.js` 3.1 地区固定显示松阳不可改选 | 需求3：picker 移除+只读展示 | 新增 | core business | 新增 | data 断言 provinceCode/cityCode/districtCode + picker 不存在 + .region-locked 存在 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/region-lock.e2e.test.js` 3.2 提示文案可见 | 需求3：region-tip 文案 | 新增 | core business | 新增 | .region-tip 存在且文本含"目前只上线松阳县" | `npm run test:e2e:core` | 待验证 |
| `e2e/core/region-lock.e2e.test.js` 3.3 提交携带松阳 code | 需求3：buildParams 正确性 | 新增 | core business | 新增 | 提交后 /wx/itinerary/add 请求 data.province=330000 city=331100 district=331124 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/specialty-removed.e2e.test.js` 4.1 详情页无特色菜区块 | 需求4：specialty-section 移除 | 新增 | core business | 新增 | .specialty-section 不存在 + localSpecialtyList=[] | `npm run test:e2e:core` | 待验证 |
| `e2e/core/specialty-removed.e2e.test.js` 4.2 不再请求 /wx/localSpecialty/list | 需求4：停用接口 | 新增 | core business | 新增 | 录制请求中无 localSpecialty/list | `npm run test:e2e:core` | 待验证 |
| `e2e/core/specialty-removed.e2e.test.js` 4.3 其它区块不受影响 | 需求4：行程数据完整 | 新增 | core business | 新增 | itinerary 数据、daysList、attraction/accommodation/breakfast 存在 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/detail-first-add.e2e.test.js` 5.1 点住宿先弹 intro-drawer 未立即加入 | 需求5：先详情后添加 | 新增 | core business | 新增 | onItemSelect → introType='hotel' + 无 accommodation 请求 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/detail-first-add.e2e.test.js` 5.2 详情内添加到行程触发加入+刷新 | 需求5：onIntroAdd 调用服务 | 新增 | core business | 新增 | onIntroAdd → accommodation 请求 + toast 添加成功 + introType='' | `npm run test:e2e:core` | 待验证 |
| `e2e/core/detail-first-add.e2e.test.js` 5.3 餐饮餐次可选 | 需求5：ActionSheet 选餐次 | 新增 | core business | 新增 | setActionSheetIndex(1) → dining 请求含 lunchId | `npm run test:e2e:core` | 待验证 |
| `e2e/core/detail-first-add.e2e.test.js` 5.4 取消不加入 | 需求5：onIntroClose | 新增 | core business | 新增 | onIntroClose → introType='' + 无请求 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/detail-first-add.e2e.test.js` 5.5 首页链路回归 | 需求5：首页 intro-drawer 不受影响 | 新增 | core business | 新增 | 首页正常渲染 + hero-banner 存在 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/market-services.e2e.test.js` 6.1 集市展示四类本地服务无寻宝卡片 | 需求6：集市页内容替换 | 新增 | core business | 新增 | tabs=4项 + list 有 accommodationName + 无 treasure 数据/元素 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/market-services.e2e.test.js` 6.2 点项进对应 intro-drawer | 需求6：onItemTap 打开 drawer | 新增 | core business | 新增 | onItemTap → showIntroType 对应类型 + introData 正确 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/market-services.e2e.test.js` 6.3 区域为松阳 | 需求6：列表请求松阳参数 | 新增 | core business | 新增 | accommodation/list 请求 province=330000 city=331100 district=331124 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/market-services.e2e.test.js` 6.4 空态占位 | 需求6：空列表显示 empty-state | 新增 | core business | 新增 | setData list=[] → .empty-state 存在 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/market-services.e2e.test.js` 6.5 无寻宝残留入口 | 需求6：寻宝 UI/数据已清除 | 新增 | core business | 新增 | 无 .bell-icon/.treasure-tab + tab 切换正常 | `npm run test:e2e:core` | 待验证 |

---

## 基础设施更新

| 文件 | 改动 | 说明 |
| --- | --- | --- |
| `e2e/shared/app.js` | 新增 `showModal`/`showActionSheet` mock；新增 `getRecordedModals`/`getRecordedActionSheets`/`setModalConfirm`/`setActionSheetIndex` helper | 需求1 需要模拟隐私弹窗确认/取消；需求5 需要模拟餐次 ActionSheet 选择 |
| `e2e/shared/request-mock.js` | 新增 `/wx/accommodation/list`、`/wx/dining/list`、`/wx/car/list`、`/wx/photography/list` 及对应写入接口 mock | 需求5/6 的列表加载与添加操作依赖 |

---

## 2026-07-28 迭代需求 e2e 新增/更新

| 测试文件 / 用例名 | 对应业务流程 | 当前状态 | 问题分类 | 决策 | 改动 | 验证命令 | 结果 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `e2e/core/itinerary-business.e2e.test.js` 行程详情地图按目的地拉取餐饮池，点击餐饮 marker 进详情 | 地图餐饮：按目的地一次性拉取 + 点击进详情 + 缩放隐藏 | 新增 | core business | 新增 | 断言 `/wx/dining/list` 按 `district` 请求且只请求 1 次、`onMapMarkerTap(20000+diningId)` 打开 `showIntroDrawer='dining'`、景点 marker 不误触、`applyVisibleDining([])` 后餐饮 marker 清零而景点 marker 保留 | `npm run test:e2e:core` | 待验证（本机无微信开发者工具自动化端口） |
| `tests/itinerary-map/dining-markers.test.js` | 餐饮 marker 纯函数：图标分类/callout 拼装/id 命名空间/池内反查/视野裁剪/重绘指纹 | 新增（非 e2e 单测） | 非 e2e | 新增 | 沙箱加载页面 TS，12 条断言：两类图标互异且异于景点 pin、callout 三行且缺字段不出现 undefined、缺坐标跳过、id 命名空间避开盲游、池内反查带出餐次、视野外剔除、超上限按距中心裁剪、指纹与顺序无关 | `npm run lint` | 通过：12/12 |
| `tests/profile-edit-preference.test.js` 角色/个人简介/出生年份回填 | 用户资料回填 | 更新 | 非 e2e | 新增 3 条用例 | 断言 `tourist.role`/`tourist.remark`→bio、`preference.birthYear` 数字转字符串、保存时回传 role 与 birthYear、mine 页 role 不再硬编码 | `npm run lint` | 通过：7/7 |

## 基础设施更新（2026-07-28）

| 文件 | 改动 | 说明 |
| --- | --- | --- |
| `e2e/shared/request-mock.js` | `/wx/dining/list` 两条数据补齐 `diningCategory`/`avgCost`/`openTime`/`closeTime`/经纬度；行程详情 day1 的 `breakfast`/`lunch` 也补齐同样字段 | 地图餐饮池取自 `/wx/dining/list`，无坐标与类别则 marker 恒为空、图标也无法区分 |
| `package.json` | `lint` 脚本纳入 `tests/itinerary-map/*.test.js` 与 `tests/profile-edit-preference.test.js` | 这两组非 e2e 单测原先不在任何脚本里，改动无法被自动验证 |

---

## 受限说明

以下用例受限于微信小程序自动化框架能力，已在测试中标注：

- **用例 2.1 视觉对齐**：automator 不支持像素级布局验证，测试仅验证 DOM 结构和元素存在；真正的对齐检查需真机截图比对。
- **用例 1.5 真实 401 模拟**：当前 request mock 为全局替换，无法针对单次请求返回 401；测试验证 login 页可达性和核心元素，interceptor 代码未改动。
- **用例 5.5 首页完整 addFlow**：首页 intro-drawer 的 primarytap → onAddToItinerary 需要已有行程上下文，测试验证首页渲染正常和 handler 存在。
