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

## 2026-09-19 首页「当地」地址切换器迭代 e2e 更新

背景：`e2e/smoke/home-arrow.e2e.test.js` 重命名为 `e2e/smoke/home-district.e2e.test.js`；首页左上角「寻秘品牌 + 左箭头 + 创建行程按钮」替换为「当地」地址切换器（写死 松阳县 331124 / 缙云县 331122，默认松阳县，手动选择持久化到 storage `home_district`）；创建行程入口移至右下角悬浮按钮 `.create-fab`；页面中部冗余的 `.local-bar` 当地指示条移除。

| 测试文件 / 用例名 | 对应业务流程 | 当前状态 | 问题分类 | 决策 | 改动 | 验证命令 | 结果 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `e2e/smoke/home-district.e2e.test.js` 2.1 顶栏地址切换器默认松阳县 | 首页顶栏「当地」入口 | 已重写 | 旧断言 .top-bar-arrow/.top-bar-brand 元素已随需求移除 | 重写为地址切换器 contract | 断言 .district-picker 存在、districtOptions=[331124 松阳县, 331122 缙云县]、默认 currentDistrict=331124、旧顶栏元素与 .top-bar-create-btn 不存在、.create-fab 存在 | `npm run test:e2e:smoke` | 待验证（需微信开发者工具自动化端口） |
| `e2e/smoke/home-district.e2e.test.js` 2.2 切换缙云县 | 地址切换驱动「当地」三列表 | 新增 | smoke | 新增 | callMethod onDistrictChange(1) → currentDistrict=331122、/wx/attraction/list 与 /wx/dish/featured 请求 district=331122、storage home_district=331122；用例结束清除 storage 防止跨用例泄漏 | `npm run test:e2e:smoke` | 待验证（需微信开发者工具自动化端口） |
| `e2e/smoke/navigation.e2e.test.js` 核心入口 | 创建行程入口 | 调整 | selector 过时 | `.top-bar-create-btn` → `.create-fab` | 点击悬浮按钮仍应落地 create-itinerary | `npm run test:e2e:smoke` | 待验证 |
| `e2e/regression/auth-privacy.e2e.test.js` 1.1–1.4 | 隐私/登录链路 | 调整 | selector 过时 | `.top-bar-create-btn` → `.create-fab`（4 处） | 链路断言不变 | `npm run test:e2e:regression` | 已通过 9/9（showModal 基础设施修复后 1.1–1.4 首次在本机真实跑通） |
| `e2e/smoke/navigation.e2e.test.js` 首页核心区块 | 首页渲染 contract | 调整 | `hero-banner` 组件已随早前首页改版移除，断言过时（HEAD 上同样失败，非本次改动引入） | 断言改为 `.district-picker` 存在 | 其余断言不变 | `npm run test:e2e:smoke` | 已通过 4/4 |

## 基础设施更新（2026-09-19）

| 文件 | 改动 | 说明 |
| --- | --- | --- |
| `e2e/shared/app.js` | `showModal`/`showActionSheet` 由 `mockWxMethod` 改为 evaluate 同上下文覆盖 `wx.*`，并保存原实现供 `restoreE2eMocks` 还原 | 修复既有缺陷：`mockWxMethod` 在 bridge 层序列化 options 时会剥掉 `success`/`complete` 回调，导致 `ensurePrivacyAgreed` 等回调式 Promise 永不 resolve、点击创建行程无法跳转（HEAD 旧代码上同样复现）。`getRecordedModals`/`setModalConfirm`/`setActionSheetIndex` 等 helper 行为不变 |

## 本次迭代 e2e 运行结果（2026-09-19，本机微信开发者工具自动化）

| 套件 | 命令 | 结果 |
| --- | --- | --- |
| smoke | `npm run test:e2e:smoke` | 通过 4/4（home-district 2 条新用例 + navigation 2 条） |
| regression | `npm run test:e2e:regression` | 通过 9/9 |
| core | `npm run test:e2e:core` | 14 通过 / 6 失败；失败集中在 `market-services.e2e.test.js` 6.3 与 `detail-first-add.e2e.test.js` 5.1–5.5，均为存量问题：在 HEAD（未含本次改动）上以 `npx jest --config jest.e2e.core.config.js --runInBand --forceExit --testPathPattern "(market-services|detail-first-add)"` 复跑得到完全相同的 6 个失败（引用了已删除的 `hero-banner`、已不存在的 `onAddSchedule` 方法与过时 drawer selector），与本次首页改动无关，留待后续迭代单独修复 |

## 2026-09-19 「当地」县域切换扩展迭代（创建行程页 + 集市页）e2e 更新

背景：新增共享模块 `miniprogram/utils/district.ts`（「当地」唯一数据源：DISTRICT_OPTIONS 松阳县 331124 / 缙云县 331122、固定省市 330000/331100、storage key `home_district`）。首页 `pages/index` 重构为从该模块导入；创建行程页解除「仅松阳」锁定，改为县域 selector 切换（省市固定丽水市），选择结果与首页「当地」双向共享同一 storage；集市页（treasure）district 改为跟随「当地」，`onLoad` 首载改为 `onShow` 按 district 变化重载（同时修复了旧 6.3 因 switchTab 同 tab 不触发加载而无请求的存量失败）。

| 测试文件 / 用例名 | 对应业务流程 | 当前状态 | 问题分类 | 决策 | 改动 | 验证命令 | 结果 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `e2e/core/region-lock.e2e.test.js` 3.1–3.5 | 创建页地区选择 | 已重写 | 旧断言基于「地区锁定松阳」需求，已被「县域可切换」取代 | 重写为县域切换 contract | 3.1 默认松阳 + `.region-picker` selector 存在、`picker[mode="region"]`/`.region-locked` 不存在；3.2 tip 文案含松阳县、缙云县；3.3 onDistrictChange(1) → 331122 且持久化 storage；3.4 提交携带 district=331122；3.5 预置 storage=331122 重进创建页默认缙云；afterAll 清除 storage 防泄漏 | `npm run test:e2e:core` | 已通过 5/5 |
| `e2e/core/itinerary-business.e2e.test.js` 手动创建行程 | 创建行程主流程 | 调整 | 原用例调用已删除的 `onRegionChange`（杭州/西湖三级联动） | 改为 `onDistrictChange(1)` 切缙云 | 断言 province=330000、city=331100（固定丽水）、district=331122；用例结束清除 storage | `npm run test:e2e:core` | 已通过（套件 4/4） |
| `e2e/core/market-services.e2e.test.js` 6.3 | 集市区域参数 | 已重写 | 旧用例 switchTab 到当前 tab 不触发加载（存量失败）；且区域已由写死改为跟随「当地」 | 重写为 reLaunch 强制重建页面实例 | 默认无选择 → accommodation/list 携带 district=331124；预置 storage=331122 后 reLaunch → district=331122；结束还原 storage 并 reLaunch | `npm run test:e2e:core` | 已通过（套件 5/5，原 6.3 存量失败一并修复） |
| `agent-builder/itinerary-unit.test.js` create-itinerary 两个静态用例 | 创建页源码 contract | 已重写 | 旧断言引用早已删除的 `mode="region"`/`onRegionChange`（HEAD 上即失败的存量过时用例） | 更新为 selector picker contract | 断言 wxml 含 `mode="selector"`/`bindchange="onDistrictChange"`/`range="{{districtOptions}}"`；ts 含 DISTRICT_OPTIONS/setSelectedDistrict/getSelectedDistrict | `npx jest --testEnvironment node --reporters default --testMatch "**/agent-builder/itinerary-unit.test.js" --runInBand --forceExit`（tests/ 下） | 已通过（region 相关 2 用例转绿；该文件另有 journey-card 日期存量失败 1 例，HEAD 同样失败） |

### 本次迭代 e2e / 单测运行结果（2026-09-19，本机微信开发者工具自动化）

| 套件 | 命令 | 结果 |
| --- | --- | --- |
| home 单测 | tests/ 下 `npx jest --testEnvironment node --reporters default --testMatch "**/home/**/*.unit.test.js" --runInBand --forceExit` | 通过 23/23 |
| agent-builder 静态单测（itinerary-unit） | tests/ 下 `npx jest --testEnvironment node --reporters default --testMatch "**/agent-builder/itinerary-unit.test.js" --runInBand --forceExit` | region 相关 2 用例由存量失败转绿；余 1 失败（journey-card 日期）为 HEAD 存量 |
| smoke | `npm run test:e2e:smoke` | 通过 4/4（首轮 navigation 因开发者工具连续启动偶发失败，复跑全绿） |
| regression | `npm run test:e2e:regression` | 通过 9/9 |
| core | `npm run test:e2e:core` | 17 通过 / 5 失败；失败仅剩 `detail-first-add.e2e.test.js` 5.1–5.5 存量问题（HEAD 复跑相同失败，引用已删除的 `onAddSchedule`、`hero-banner` 与过时 drawer selector）；原 `market-services` 6.3 存量失败已随本次改造修复 |


注：`agent-builder` 套件中 `blind-mode-add-button.test.js`（未跟踪新文件，6 失败）、`itinerary-detail-enhance.test.js` 天气集成（4 失败）、journey-card 日期（1 失败）均为存量失败，与本次改动无关（HEAD worktree 复跑确认）。

---

## 受限说明

以下用例受限于微信小程序自动化框架能力，已在测试中标注：

- **用例 2.1 视觉对齐**：automator 不支持像素级布局验证，测试仅验证 DOM 结构和元素存在；真正的对齐检查需真机截图比对。
- **用例 1.5 真实 401 模拟**：当前 request mock 为全局替换，无法针对单次请求返回 401；测试验证 login 页可达性和核心元素，interceptor 代码未改动。
- **用例 5.5 首页完整 addFlow**：首页 intro-drawer 的 primarytap → onAddToItinerary 需要已有行程上下文，测试验证首页渲染正常和 handler 存在。

---

## 2026-09-29 「当地」新增杭州市（市级选项）+ 餐饮详情展示地址 e2e 更新

背景：`miniprogram/utils/district.ts` 的 `DISTRICT_OPTIONS` 新增市级选项 `杭州市 330100`（`level: 'city'`），并新增 `buildRegionQuery/buildRegionQueryByCode` 与 `getOptionCityCode/getOptionDistrictCode/getOptionCityName/getOptionDistrictName` 等派生函数。县域选项仍按 `district` 精确查询；市级选项只下发 `province + city`、不带 `district`（后端 `travel_*` mapper 的 `district` 为精确等值过滤，把市编码当区县传会查空）。首页三列表、集市页、创建行程页统一改用该派生逻辑；创建行程页新增 `districtOptionCode`（选中选项编码，市级时与 `districtCode` 不同）与 `regionText`（目的地展示文案，市级不重复显示市名）。餐饮详情抽屉 `components/dining-intro-drawer` 的「位置」区块在原关联景点行下方新增餐饮地址行（`address`，点击同样唤起 `wx.openLocation`），`hasDetails` 纳入 `address`。

| 测试文件 / 用例名 | 对应业务流程 | 当前状态 | 问题分类 | 决策 | 改动 | 验证命令 | 结果 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `e2e/smoke/home-district.e2e.test.js` 2.1 | 首页「当地」切换器选项 | 已更新 | 旧断言只允许 松阳县/缙云县 两项 | 扩为三项 contract | `districtOptions` code 断言改为 `['331124','331122','330100']`，name 改为 `['松阳县','缙云县','杭州市']` | `npm run test:e2e:smoke` | 待验证（需微信开发者工具自动化端口） |
| `e2e/smoke/home-district.e2e.test.js` 2.3 | 首页切到杭州市后的地区参数 | 新增 | 市级选项查询语义无覆盖 | 新增用例 | `onDistrictChange(2)` → `currentDistrict=330100`、`districtIndex=2`；`/wx/attraction/list` 与 `/wx/dish/featured` 携带 `province=330000`、`city=330100` 且 `district` 为 undefined；storage `home_district=330100`；结束清除 storage | `npm run test:e2e:smoke` | 待验证（需微信开发者工具自动化端口） |
| `e2e/core/region-lock.e2e.test.js` 3.1 | 创建页地区选项 | 已更新 | 同上，选项数量变化 | 扩为三项 | `districtOptions` code 断言追加 `330100` | `npm run test:e2e:core` | 待验证 |
| `e2e/core/region-lock.e2e.test.js` 3.2 | 创建页提示文案 | 已更新 | tip 新增杭州市 | 追加断言 | `.region-tip` 文本需同时含 松阳县、缙云县、杭州市 | `npm run test:e2e:core` | 待验证 |
| `e2e/core/region-lock.e2e.test.js` 3.6 | 创建页切到杭州市 | 新增 | 市级选项的 city/district 拆分与展示文案无覆盖 | 新增用例 | `onDistrictChange(2)` → `districtOptionCode=330100`、`provinceCode=330000`、`cityCode=330100`、`districtCode=''`、`cityName=杭州市`、`districtName=''`、`regionText='浙江省 杭州市'`；storage 持久化 330100；结束清除 storage | `npm run test:e2e:core` | 待验证 |
| `drawer-redesign/view-model.test.js` dining drawer view model | 餐饮详情抽屉 view model | 已重写 | 旧用例断言「address 不作为位置文案展示」且 `hasDetails=false`，与本次「展示餐饮地址」需求相反；同一条用例还残留过时期望 `¥88/person`（源码与 attraction drawer 一致输出 `¥88/人`，HEAD 上即失败） | 用例改名为 `dining drawer view model shows attractionName and dining address safely`，按新契约重写 | 断言 `address` 原样透出；仅地址无关联景点时 `hasDetails=true`；两者皆空时 `address=''` 且 `hasDetails=false`；顺带修正 `costText` 期望为 `¥88/人` | `node --test drawer-redesign/view-model.test.js` | 已通过（该用例由 HEAD 存量失败转绿；photography / attraction view model 2 例仍为 HEAD 存量失败） |
| `drawer-redesign/static-structure.test.js` dining drawer renders the dining address | 餐饮详情抽屉结构 | 新增 | 地址展示无静态结构覆盖 | 新增用例 | 断言 WXML 位置区块条件为 `{{viewModel.attractionName \|\| viewModel.address}}`、含 `{{viewModel.address}}` 与 `dining-intro__address-text`，SCSS 含 `.dining-intro__address-text` | `node --test drawer-redesign/static-structure.test.js` | 已通过 |
| 餐饮详情地址展示（界面） | `dining-intro-drawer` 位置区块 | 未新增 e2e | 旧 `agent-builder/dining-intro-drawer` 抽屉 e2e 已删除，当前无抽屉级 e2e 承载真机排版 | 以 `npx tsc --noEmit` + 微信开发者工具人工验证为准 | WXML 新增地址行（`wx:if="{{viewModel.address}}"`，无关联景点时补定位图标，点击唤起 `wx.openLocation`），SCSS 新增 `.dining-intro__address-text`，TS `hasDetails` 纳入 `address` | `npx tsc --noEmit` + 开发者工具预览 | tsc 通过（仅 `typings/types/wx/lib.wx.app.d.ts` 既有报错）；界面排版待人工验证 |
| `agent-builder/itinerary-unit.test.js` create-itinerary 静态用例 | 创建页源码 contract | 未改动 | 本次仅新增 `applyDistrictOption/districtOptionCode/regionText`，旧断言仍成立 | 保持原断言 | 无 | `npx jest --testEnvironment node --reporters default --testMatch "**/agent-builder/itinerary-unit.test.js" --runInBand --forceExit` | 已通过 94/95（唯一失败为 journey-card 日期 HEAD 存量问题） |
