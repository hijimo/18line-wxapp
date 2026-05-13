# AGENTS.md

## 默认协作规则

- 始终使用中文回复。
- 本项目默认按 `.codex/agents/engineering-wechat-mini-program-developer.md` 的角色与规则进行开发。
- 处理任何微信小程序页面、组件、接口、授权、支付、订阅消息、性能、分包、审核合规相关任务时，都要优先遵循该 Codex agent 的规则。
- 修改前先阅读现有实现，保持当前项目结构和风格，不要顺手重构无关代码。
- 当前工作区可能存在用户未提交改动，禁止回退或覆盖与任务无关的变更。

## 项目概览

- 这是一个微信小程序项目，源码位于 `miniprogram/`。
- 技术栈为微信小程序原生结构、TypeScript、WXML、SCSS、WXS。
- `project.config.json` 配置了 `miniprogramRoot: "miniprogram/"`，并启用 TypeScript 与 Sass 编译插件。
- 路径别名 `@/*` 指向 `miniprogram/*`。
- 自动化测试相关代码位于 `tests/`。

## 目录约定

- `miniprogram/pages/`：页面目录，通常包含 `index.ts`、`index.wxml`、`index.scss`、`index.json`。
- `miniprogram/components/`：可复用自定义组件。
- `miniprogram/services/`：业务服务、后端接口、领域逻辑。
- `miniprogram/utils/`：通用工具、请求封装、授权、上传、存储等。
- `miniprogram/types/`：共享 TypeScript 类型。
- `miniprogram/assets/`：图片和静态资源。
- `docs/`：方案和设计文档。

## 开发规则

- 不使用 DOM API。小程序视图更新必须通过数据绑定和 `setData`。
- 控制 `setData` 调用次数和数据体积，优先批量更新，只传视图需要的字段。
- 新增页面必须同步更新 `miniprogram/app.json` 的 `pages` 配置；新增组件必须在对应 `.json` 中声明。
- 网络请求、授权、上传、缓存等能力优先复用 `miniprogram/utils/` 和 `miniprogram/services/` 中已有封装。
- 生产网络请求必须满足 HTTPS 和微信后台域名白名单要求。
- 涉及位置、用户资料、相册、订阅消息等敏感权限时，必须有明确的用户触发和可见用途说明。
- 支付流程必须以服务端订单和回调校验为准，前端 `wx.requestPayment` 成功回调不能作为最终支付凭证。
- 注意主包体积和启动性能，低频或重资源功能优先考虑分包或懒加载。

## 静态资源与 OSS

- 本项目的 `miniprogram/assets/images/` 图片资源默认上传到阿里云 OSS，后续页面和组件应优先使用 OSS 在线地址，避免继续扩大小程序包体积。
- OSS 上传工具是开发辅助工具，不属于小程序运行时代码。工具位于 `tools/oss/assets.mjs`。
- 本地 OSS 参数放在 `.env.local`，不要提交真实 AccessKey；可参考 `.env.example`。
- 上传全部图片：`pnpm upload:assets`。
- 上传后会生成本地清单 `miniprogram/assets/oss-images.json`，该文件是临时生成物，不提交；即使清单不存在，也可以用文件名和尺寸生成标准 OSS 地址。
- 按元素显示尺寸生成 2x 图片地址：`pnpm oss:image-url -- <图片文件名> --width <元素宽度> --height <元素高度>`。
- 生成 2x 地址时工具会自动拼接阿里云 OSS resize 参数，例如 `x-oss-process=image/resize,m_lfit,w_<元素宽度*2>,h_<元素高度*2>`；SVG 不需要 resize 参数。
- 小程序后台需要将 `travel18.oss-cn-hangzhou.aliyuncs.com` 配置到合法下载域名，否则线上图片可能无法加载。
- 新增或替换 `assets/images` 图片后，先运行 `pnpm upload:assets`，再把 WXML/TS 中的本地图片引用替换为清单中的在线地址或按元素尺寸生成的 2x resize 地址。

## UI 与样式规则

- 遵循 `.kiro/steering/design.md` 中的 "The Digital Field Guide" 设计方向。
- 优先使用项目已有的森林绿主色、日落橙强调色、纸张式层级背景和 12px 左右圆角。
- 避免大量 1px 分割线和纯黑/纯灰；用背景层级、留白和轻量边界表达结构。
- 页面与组件必须适配小屏移动端，避免文字溢出、元素重叠和不可点击区域过小。
- 样式改动应保持在对应页面或组件的 `.scss` 内，只有确有复用价值时再抽公共样式。

## 常用命令

- 安装根依赖：`pnpm install`
- TypeScript 检查：`npx tsc --noEmit`
- 上传静态图片到 OSS：`pnpm upload:assets`
- 生成 OSS 2x 图片地址：`pnpm oss:image-url -- <图片文件名> --width <元素宽度> --height <元素高度>`
- 安装测试依赖：`cd tests && pnpm install`
- 运行全部自动化测试：`cd tests && pnpm test:all`
- 运行对抗验证：`cd tests && pnpm test:adversarial`

## 验证要求

- TypeScript 或逻辑改动后，优先运行 `npx tsc --noEmit`。
- 测试相关改动后，在 `tests/` 下运行对应测试命令。
- 页面、样式、生命周期、授权、支付、订阅消息等微信能力改动，需要说明还需使用微信开发者工具或真机预览验证。
- 如果命令因现有项目问题失败，只记录失败原因和关键报错，不要掩盖未验证状态。
