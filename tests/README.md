# 自动化测试

本目录当前以 `tests/e2e/` 下的新分层 e2e 流程为准。旧的 `agent-builder` / `agent-reviewer` 对抗式自动化测试已经删除，不再作为默认测试入口。

## 测试分层

- `auth/setup`：独立执行登录页 e2e，登录成功后保存可复用登录态到 `tests/.auth/login-state.json`。
- `smoke`：复用登录态，验证小程序可启动、核心 tab 和核心入口可访问。
- `core business`：覆盖当前真实业务关键流程，断言业务结果和请求参数，而不是只检查按钮存在。
- `regression`：保留仍符合当前业务的历史回归点，删除或重写过时入口、字段和交互。
- `cleanup/isolation`：每个 suite 独立启动小程序实例，统一安装 mock fixture；测试数据使用固定 e2e fixture 和状态隔离。

详细说明见：

- `e2e/README.md`
- `e2e/TEST_SYNC_MATRIX.md`

## 运行命令

确保微信开发者工具已开启「设置 -> 安全设置 -> 服务端口」。

```bash
# 完整 e2e
npm run test:e2e

# 分层运行
npm run test:e2e:auth
npm run test:e2e:smoke
npm run test:e2e:core
npm run test:e2e:regression

# 默认全量自动化测试入口
npm run test:all
```

根项目也提供转发命令：

```bash
npm run test:e2e
npm run test:e2e:auth
npm run test:e2e:smoke
npm run test:e2e:core
npm run test:e2e:regression
```

## 后续维护规则

- 新增业务 e2e 前，先更新 `e2e/TEST_SYNC_MATRIX.md`，说明业务流程、分类、决策和验证命令。
- 业务测试默认通过 `e2e/shared/app.js` 的 `ensureAuthenticated` 复用登录态；不要在每条业务测试中重复登录。
- selector 优先使用当前稳定的组件、类名、文案或后续新增的测试标识；不要依赖旧页面结构。
- 删除旧测试时必须在同步矩阵中写明原因，确认没有丢失当前业务 contract。
- 不要为了变绿削弱断言；核心流程必须验证业务结果、请求参数或页面状态变化。
