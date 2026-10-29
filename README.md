# ICE3 Agent Console

> Document ID: ICE3-AGENT-RM-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

ICE3 Agent Console 展示对话式 Agent 如何通过一组小而严格的工具接口操作工业 3D
Scene。默认模型是一座完全虚构的市政污水处理厂。

应用支持确定性的浏览器本地 Agent、服务端脚本 Agent，以及可选的兼容模型接口。对话和
Scene 状态更新时，3D 舞台始终保持挂载。

所有内置 autoplay、快捷操作、脚本 Agent 和 E2E 只针对这座虚构污水处理厂，不提供
其它演示 Asset 的切换入口。其它已获准使用的 3D 模型应按
[接入其它 3D 模型](docs/guides/other-models.md)配置为独立部署。

## 能力

| 领域 | 能力 |
|---|---|
| 对话 | 流式文本、工具调用、运行错误和取消 |
| Scene | 设备发现、选择、聚焦、高亮、相机视角和清除 |
| 传输 | 浏览器本地脚本模式或服务端事件流 |
| 相机 | 多站点引导巡游和响应式舞台取景 |
| Selection | 醒目的黄色脉冲和持续选中状态 |
| 展示 | 分组内置剧本和快捷操作 |
| 部署 | 服务端开发模式和无凭据静态演示 |

本工程是应用层，依赖公开 engine API，不向 engine 或 industrial core 增加 Agent 概念。

## 快速开始

运行要求：

- Node.js 24.22.1 LTS
- npm 11 或更高版本
- 支持 WebGL2 的当前 Chromium 或 WebKit 浏览器

```bash
git clone https://github.com/ice-3d/ice3-agent-console.git
cd ice3-agent-console
nvm use
npm install
npm run dev
```

打开 `http://127.0.0.1:8110/`；Agent 服务监听 `http://127.0.0.1:8099/`。Scene 加载完成后
开始总览巡游。

## 浏览器本地演示

```bash
npm run build:demo
npx http-server dist -p 8111 -c-1
```

打开 `http://127.0.0.1:8111/`。静态演示构建使用确定性的本地 Agent，不需要 API key
或服务端。

URL 控制参数：

- `?demo=1` 或 `?demo=0` 选择本地或服务端传输。
- `?autoplay=1` 或 `?autoplay=0` 控制开场巡游。

无效值回退到构建默认值。

## Real-Model 服务端

这里的 “Real-Model” 指 AI 推理服务，不是 3D 场景模型。

同时配置以下三个变量：

```bash
export ICE_AGENT_MODEL_BASE_URL='https://model.example/v1'
export ICE_AGENT_MODEL_API_KEY='replace-with-your-secret'
export ICE_AGENT_MODEL_NAME='industrial-agent'
npm run dev
```

API key 只保留在服务端。`/health` 报告运行模式和接口 host，不返回凭据。模型已经配置但
不可用时，应用返回错误，不会静默切换到脚本输出。

详见 [Real-Model 服务端](docs/guides/real-model-server.md)。

## Scene 工具

暴露给 Agent 的 Scene 工具仅为：

- `find_equipment`
- `select_equipment`
- `focus_equipment`
- `highlight_equipment`
- `set_camera_view`
- `clear_scene_focus`

未知工具会被拒绝。参数格式错误时只显示错误，不执行工具。

## 验证

```bash
npm run docs:check
npm run typecheck
npm test
npm run test:e2e
npm run verify
```

## 文档

- [文档索引](docs/README.md)
- [应用架构](docs/architecture.md)
- [本地开发](docs/guides/local-development.md)
- [静态部署](docs/guides/static-deployment.md)
- [Real-Model 服务端](docs/guides/real-model-server.md)
- [接入其它 3D 模型](docs/guides/other-models.md)
- [事件和 Scene 工具协议](docs/reference/protocol.md)
- [架构决策](docs/decisions/README.md)

## AI 辅助开发

本项目在设计和实现过程中大量使用了 AI 辅助开发。

## 许可证

本项目采用 [MIT License](LICENSE) 许可。
