# Scripted 与 Real-Model transport

> Document ID: ICE3-AGENT-ADR-002
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## 背景

静态演示必须无需凭据即可运行，已配置部署则可以使用真实模型。在两种模式之间静默回退
会掩盖配置错误，并使演示失真。

## 决策

Transport 必须明确选择：

- static demo build 默认使用 browser-local scripted mode。
- server build 默认使用 server transport。
- URL parameter 可以覆盖 build default。
- 所有 model variable 缺失时选择 scripted server。
- partial model configuration 无效。
- 已配置 model 失败时报告 error，不回退。

## 备选方案

- network 或 model 失败时自动回退。
- 每次演示都要求凭据。
- static build 始终使用 server transport。

这些方案会隐藏失败、阻止离线演示，或造成 deployment coupling。

## 影响

- Static demo 可复现且无需凭据。
- Real-Model 行为可观察，失败保持可见。
- Local 与 server transport 使用同一 event protocol。

## 验证

```bash
npm test -- tests/server-config.test.ts
npm test -- tests/model-client.test.ts
```

## 关联文档

- `ICE3-AGENT-GUIDE-002` — [静态部署](../guides/static-deployment.md)
- `ICE3-AGENT-GUIDE-003` — [Real-Model 服务端](../guides/real-model-server.md)
- `ICE3-AGENT-REF-001` — [Protocol](../reference/protocol.md)
