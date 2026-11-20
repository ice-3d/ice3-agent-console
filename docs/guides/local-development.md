# ICE3 Agent Console 本地开发

> Document ID: ICE3-AGENT-GUIDE-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## 1. 目标结果

同时运行 Web 应用和 Agent service，并验证脚本对话和 Scene action。

## 2. 前置条件

- Node.js 24.22.1 LTS
- npm 11 或更高版本
- 支持 WebGL2 的浏览器

未配置 model variable 时，本地 Agent service 默认使用 scripted mode。默认 Scene 固定
为虚构污水处理厂；加载其它合规 3D 模型的方法见
[接入其它 3D 模型](other-models.md)。

## 3. 操作步骤

```bash
nvm use
npm install
npm run dev
```

预期服务：

- 应用：`http://127.0.0.1:8110/`
- Agent API: `http://127.0.0.1:8099/`
- 健康检查：`http://127.0.0.1:8099/health`

调试时可使用 `?autoplay=0` 关闭开场巡游。

## 4. 聚焦测试

```bash
npm run typecheck
npm test
npm run assets:check
npm run test:e2e
```

## 5. 故障诊断

| 现象 | 检查 |
|---|---|
| Scene 未加载 | 检查 Engine Asset 链接和浏览器网络错误 |
| Agent service 不可用 | 检查 `8099` 端口和 `/health` |
| Model variable 不完整 | 同时设置三个 model variable，或全部不设置 |
| Tool 可见但不执行 | 检查 protocol reference 中的 tool name 和 JSON argument |
| 巡游未开始 | 检查 `autoplay` URL parameter 和 reduced-motion 行为 |
| 相机点击时轻微偏转 | 检查 `dragThresholdPixels` 和 selection click threshold；Console 当前为 4px |
| 近景被提前裁掉 | 检查 dynamic near/far；Console 在 close-up 时把 near 最低降到 0.02m |
| 资产文件存在但画面仍旧 | 运行 `npm run assets:check`，确认 Studio source digest 与 committed export 一致 |

## 6. 关联文档

- `ICE3-AGENT-RM-001` — [README](../../README.md)
- `ICE3-AGENT-GUIDE-002` — [静态部署](static-deployment.md)
- `ICE3-AGENT-GUIDE-003` — [Real-Model 服务端](real-model-server.md)
- `ICE3-AGENT-GUIDE-004` — [接入其它 3D 模型](other-models.md)
- `ICE3-AGENT-REF-001` — [Protocol](../reference/protocol.md)
