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

## GitHub Pages

线上演示地址：

```text
https://ice-3d.github.io/ice3-agent-console/
```

仓库使用 [Deploy demo to Pages](../../.github/workflows/deploy-pages.yml) 在 `main`
更新后自动构建并发布。Workflow 会同时检出公开的 `ice3-engine` 仓库，因为当前静态
构建需要读取同级 Engine package 和虚构污水处理厂 Runtime Asset。

发布流程：

1. 检出 Agent Console 和 Engine。
2. 使用 `.nvmrc` 指定的 Node.js 24.22.1。
3. 安装两个仓库的依赖，并先构建 Engine 的公开 package。
4. 运行文档门禁、类型检查和单元测试。
5. 通过 `ICE3_EQUIPMENT_MANIFEST_REUSE=1` 复用版本库中已校验的设备清单，并执行
   `npm run build:demo`。Engine source GLB 按体积和保密策略不进入 Git，因此 CI
   不从 source 重新生成清单。
6. 将 `dist/` 作为 Pages artifact 发布。

仓库 Settings 中的 Pages Source 必须保持为 `GitHub Actions`。不要把 151 MiB 左右的
完整 `dist/` 提交到 `main`，也不要改用普通 `npm run build`，因为普通构建默认选择
server transport。

GitHub Pages 只提供静态文件，没有 `8099` Agent service。线上应使用默认地址或
`?demo=1`；`?demo=0` 会尝试连接不存在的后端。

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
