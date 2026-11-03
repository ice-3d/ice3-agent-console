# 在 Agent Console 中接入其它 3D 模型

> Document ID: ICE3-AGENT-GUIDE-004
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## 1. 适用范围

仓库中的内置演示、autoplay、快捷操作、本地脚本 Agent、服务端脚本 Agent 和 E2E
只使用完全虚构的市政污水处理厂 `ice3-virtual-wwtp`。本指南用于在独立项目部署中
替换为其它已经获准使用的 3D 模型，不改变默认示例的演示资产。

“Real-Model 服务端”中的 model 指 AI 推理模型，与 3D Asset 无关。接入其它 3D 模型
不需要修改 AI endpoint，也不表示要删除默认污水处理厂演示。

## 2. 输入要求

开始前需要准备：

1. 有权部署的 source glTF 2.0 或 GLB。
2. 已由 `ice3-studio` 生成的 Prepared GLB Tileset 和 `bindings.json`。
3. 与 Tileset 中设备 Selection ID 一致的业务清单。
4. 设备 tag、名称、工艺阶段、区域、连接关系和世界坐标 Bounds。

Runtime 不接受通用 source 转换。不得在浏览器中重新切分、简化或转换 3D 模型。

## 3. 预处理 3D Asset

优先把已获准的 source model 纳入 `ice3-studio` 工程，并执行正式 Runtime
导出：

```bash
cargo run --manifest-path ../ice3-studio/Cargo.toml -p studio-cli -- \
  export tileset \
  --project path/to/studio-project \
  --output /tmp/custom-plant \
  --asset-id custom-plant \
  --profile agent-console-v1
```

确认 `/tmp/custom-plant/tileset.json`、`bindings.json`、`parts/` 和 `coarse/`
完整生成。`bindings.json` 是设备清单的唯一生成输入；不要手工维护另一套 Bounds 或
Selection ID。

仅做几何验证时，也可以对 source 直接运行 Studio `partition`：

```bash
cargo run --manifest-path ../ice3-studio/Cargo.toml -p studio-cli -- \
  partition path/to/approved-model.glb \
  --output /tmp/custom-plant-tileset \
  --asset-id custom-plant-tileset \
  --adapter auto \
  --render-batch static \
  --lod \
  --json
```

直接 partition 不替代正式工程导出；需要设备业务绑定时应使用上面的 `export tileset`
入口。不要只复制单个 GLB，也不要手工修改 Tileset 中的相对 URI。

## 4. 准备设备业务清单

默认示例清单位于：

```text
public/assets/wastewater-plant/equipment.json
```

其它模型的清单应放在对应 Asset root 下：

```text
public/assets/custom-plant/
├── equipment.json
└── tiled/
    ├── tileset.json
    ├── parts/
    └── coarse/
```

清单结构：

```json
{
  "assetId": "custom-plant",
  "equipment": [
    {
      "selectionId": "custom-plant/equipment/EQ-001",
      "tag": "EQ-001",
      "name": "一号处理设备",
      "stage": "process",
      "area": "MainProcessArea",
      "connections": ["line-001"],
      "bounds": {
        "min": [0, 0, 0],
        "max": [2, 3, 2]
      }
    }
  ]
}
```

约束：

- `assetId` 与 Tileset 的逻辑 Asset ID 保持一致。
- 每个 `selectionId` 必须与 Prepared GLB 节点中的设备 Selection ID 完全一致。
- `selectionId` 必须唯一，不能使用显示名称代替稳定 ID。
- `bounds` 使用 Runtime 世界坐标和米制单位，包围整台可选设备。
- `stage` 和 `area` 用于 `find_equipment` 分类查询。
- `connections` 保存可公开的流程或管线 ID，不得包含敏感客户字段。

Agent Console 的设备清单必须从同一 Tileset 的 `bindings.json` 生成，不读取旧 Source
GLB，也不手工维护另一套坐标。manifest generator 会保留
`equipmentTag`、`selectionId`、`displayName`、`area` 和 Bounds，并补充 UI 使用的
工艺段、材质槽和展示配置。接入其它模型时需同步修改脚本中的 Tileset binding input
和 output：

```text
scripts/generate-equipment-manifest.mjs
```

对应配置应改为：

```js
const input = resolve('public/assets/custom-plant/tiled/bindings.json');
const output = resolve('public/assets/custom-plant/equipment.json');
```

生成器拒绝重复设备标签、Selection ID 不匹配、缺失或非有限 Bounds。不得通过复用
旧清单绕过校验。

## 5. 放置 Runtime Asset

开发服务器会从 `public/` 提供以 `/assets/` 开头的相对路径。把完整 Tileset 输出放到：

```text
public/assets/custom-plant/tiled/
```

静态部署时，`dist/assets/custom-plant/` 必须保留 `equipment.json`、`tiled/tileset.json`
以及 Tileset 引用的全部 `parts/` 和 `coarse/` 文件。默认 `scripts/copy-demo-assets.mjs`
只复制虚构污水处理厂；为 custom deployment 构建时，需要修改该脚本中的 tiled source、
manifest source 和 destination，或显式传入对应 `copyDemoAssets()` options。

```ts
await copyDemoAssets({
  source: '/tmp/custom-plant',
  manifest: 'public/assets/custom-plant/equipment.json',
  destination: 'dist/assets/custom-plant',
});
```

## 6. 配置演示资产

浏览器和内置剧本共享同一个配置：

```ts
// shared/demo-asset.ts
export const DEMO_ASSET = Object.freeze({
  id: 'custom-plant',
  label: '客户专用工业场景',
  rootPath: 'assets/custom-plant',
  manifestPath: 'equipment.json',
  tilesetPath: 'tiled/tileset.json',
});
```

该配置控制：

- `StageView` 显示的 Scene 标题。
- 浏览器请求 Tileset 和设备清单的相对 URL。
- 内置剧本生成 equipment Selection ID 时的 Asset 前缀。

只修改 URL 还不够。业务剧本必须与新模型的设备语义匹配：

- `shared/scenarios.ts` 中的工艺步骤、设备 tag、文案和聚焦顺序。
- `server/agents/scripted.ts` 中的开场巡游、设备常量和兼容关键词。
- 所有 `focus_equipment` 的 `selectionId` 都必须存在于新清单中。
- 如果模型没有水务工艺，应删除水务术语和按水务流程编写的剧本，不要保留无效入口。

## 7. 验证

开发模式：

```bash
nvm use
npm install
npm run dev
```

打开 `http://127.0.0.1:8110/?autoplay=0`，检查：

1. Network 中首先请求 `assets/custom-plant/equipment.json` 和
   `assets/custom-plant/tiled/tileset.json`。
2. 场景完成后可以查询、选择、聚焦和高亮清单中的设备。
3. 点击内置剧本会切换正确设备，不出现 unknown selection error。
4. 未接入的设备不会静默回退到虚构污水处理厂 Asset。

静态构建：

```bash
npm run typecheck
npm test
npm run build:demo
npm run test:e2e
```

默认仓库构建仍应保留 `dist/assets/wastewater-plant/tiled/tileset.json`。用于客户部署的
定制构建应单独校验新的 Asset root，不得把真实客户模型加入默认仓库资产。

## 8. 安全与发布边界

- 真实客户 source、partition output、粗模、equipment metadata、截图和本地路径不得提交
  到默认示例仓库，除非项目明确采用独立私有交付流程。
- 不把绝对文件路径、凭据、内部主机名或客户名称写入浏览器 event、日志和 manifest。
- Tileset 与设备清单默认从同源路径提供；跨源部署必须明确配置 CORS 和缓存规则。
- 已配置的 Asset 加载失败时保留明确错误，不得静默切换到污水处理厂。

## 9. 关联文档

- `ICE3-AGENT-RM-001` — [README](../../README.md)
- `ICE3-AGENT-GUIDE-001` — [本地开发](local-development.md)
- `ICE3-AGENT-GUIDE-002` — [静态部署](static-deployment.md)
- `ICE3-AGENT-REF-002` — [Runtime Asset 交付](https://github.com/ice-3d/ice3-agent-console/blob/main/docs/reference/asset-delivery.md)
- `ICE3-STUDIO-GUIDE-004` — [Studio 入门](https://github.com/ice-3d/ice3-studio/blob/main/docs/guides/getting-started.md)
