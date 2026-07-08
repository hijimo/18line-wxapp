# E2E 自动化测试流程

## 分层

- `auth/setup`：跑真实登录页交互，mock 微信登录 code 与后端登录响应，成功后把 token 写入 `tests/.auth/login-state.json`。
- `smoke`：复用登录态，验证首页、核心 tab、创建入口可访问。
- `core business`：覆盖创建行程、查看详情、切换天数、修改日期、列表查看、进入详情、删除行程。
- `regression`：覆盖登录协议、登录态丢失自动恢复、创建日期校验、首页搜索等当前仍有效的历史回归点。
- `cleanup/isolation`：每个 suite 启动独立小程序实例，统一安装 `wx.request` fixture，记录请求并在 suite 结束恢复 mock；测试数据使用 `E2E` 前缀和固定 fixture id。

## 命令

```bash
npm run test:e2e:auth
npm run test:e2e:smoke
npm run test:e2e:core
npm run test:e2e:regression
npm run test:e2e
```

业务层测试默认调用 `ensureAuthenticated`。如果登录态文件不存在、token 不匹配或小程序 storage 中 token 丢失，会自动重新执行登录 setup，避免业务测试把登录态问题误报为业务失败。
