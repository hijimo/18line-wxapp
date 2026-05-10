# 自动化测试

基于微信小程序官方 [miniprogram-automator](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/) SDK 的双Agent对抗验证测试。

详细方案文档见：[docs/方案/自动化测试对抗验证方案.md](../docs/方案/自动化测试对抗验证方案.md)

## 快速开始

```bash
cd tests
npm install
```

确保微信开发者工具已开启 **设置 → 安全设置 → 服务端口**。

## 运行

```bash
# 完整对抗验证（推荐）
node run-adversarial.js

# 单独运行 Agent Builder（功能验证）
npm run test:build

# 单独运行 Agent Reviewer（对抗验证）
npm run test:review

# Jest 直接运行
npm run test:all
```

## 目录结构

```
tests/
├── run-adversarial.js          # 对抗编排器（主入口）
├── agent-builder/              # Agent Builder（乐观派·验证功能正确）
│   ├── functional.test.js      # 功能正确性验证
│   └── data-flow.test.js       # 数据流验证
├── agent-reviewer/             # Agent Reviewer（悲观派·寻找缺陷）
│   ├── adversarial.test.js     # 安全与异常验证
│   └── stability.test.js       # 性能与稳定性验证
├── shared/                     # 共享工具与配置
└── reports/                    # 测试报告输出
```

## 配置

如果 CLI 路径非 macOS 默认，编辑 `shared/config.js`：

```javascript
// macOS
const CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';

// Windows
// const CLI_PATH = 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat';
```
