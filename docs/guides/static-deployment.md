# ICE3 Agent Console 静态部署

> Document ID: ICE3-AGENT-GUIDE-002
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## 目标结果

发布无需凭据的演示，其中包含应用、Runtime Asset 和确定性本地 Agent。

## 构建

```bash
nvm use
npm install
npm run build:demo
```

本地预览：

```bash
npx http-server dist -p 8111 -c-1
```

预期：`http://127.0.0.1:8111/` 无需 Agent service 或 model credential 即可运行。

## 发布文件

Static build 包含：

- HTML、CSS、JavaScript 和 source map。
- 仅包含虚构 Runtime `tiled/` Asset tree。
- 不包含 source GLB、prepared monolithic GLB、客户数据或凭据。

## URL 参数

- `?autoplay=0` 关闭开场巡游。
- `?demo=1` 明确选择 browser-local transport。
- `?demo=0` 选择 server transport，并要求 service 可达。

## 预期结果

无后端部署路径可以打开并加载虚构污水处理厂，并通过 local event stream 执行所有内置
场景。

默认 static build 不包含其它演示 Asset。需要发布其它合规 3D 模型时，必须保留完整的
Prepared Tileset 和设备清单，并按 [接入其它 3D 模型](other-models.md)调整 custom
deployment。

## 关联文档

- `ICE3-AGENT-RM-001` — [README](../../README.md)
- `ICE3-AGENT-ARC-001` — [架构](../architecture.md)
- `ICE3-AGENT-GUIDE-004` — [接入其它 3D 模型](other-models.md)
- `ICE3-AGENT-ADR-002` — [Transport policy](../decisions/0002-scripted-and-real-model-transport.md)
