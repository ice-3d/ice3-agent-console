# Agent Console Runtime Asset 交付

> Document ID: ICE3-AGENT-REF-002
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## 1. 输入

浏览器只消费 Studio 导出的 Runtime Tileset bundle：

```text
public/assets/<asset-id>/
├── equipment.json
└── tiled/
    ├── tileset.json
    ├── bindings.json
    ├── export.json
    ├── parts/
    └── coarse/
```

- `tileset.json` 定义 OGC 3D Tiles 1.1 层级和相对 content URI。
- `parts/*.glb` 是精细 partition，带 render batch、Selection semantic index 和静态
  Geometry。
- `coarse/*.glb` 是粗模与 coarse chunk，用于远距离和过渡覆盖。
- `bindings.json` 是 Studio 导出的业务实体、Node Selection 和 world Bounds。
- `equipment.json` 由 `bindings.json` 确定性生成，只保留显示需要的设备字段。
- `export.json` 保存 revision、source/profile digest、tile digest 和文件清单。

## 2. 加载流程

1. 浏览器先请求 `equipment.json`，建立设备查询和 focus catalog。
2. `ICETilesetLoader` 请求 `tileset.json`。
3. Loader 根据相机视锥、屏幕空间误差和常驻预算选择 visible 与 prefetch tile。
4. 粗模先提供完整覆盖；精细 partition 完成后替换对应 LOD coverage。
5. 相机离开的区域按 resident budget 驱逐。
6. Selection、业务设备和 Node identity 在 LOD 替换期间保持稳定。

网络加载是分块和按需的，不下载完整单体 source GLB。

## 3. 当前默认资产

默认污水处理厂包含：

- 4 个 fine partition。
- 4 个 coarse content。
- 103 个静态 render batch。
- 132,124 个源三角形。
- 51 个带业务 tag 的设备实体。
- 681 个包含关联构件和管线的 binding。

具体 digest 和文件长度以 `export.json` 为准。

## 4. 业务 Selection

同一设备可以跨多个 Node 和多个 partition。所有相关 Node 使用同一个
`<assetId>/equipment/<tag>` Selection ID；Renderer 通过 semantic index mask 高亮整个
设备，而不是单个池壁或栏杆。

鼠标 Selection 只接受 `equipment.json` 中存在的业务 Selection ID。`node-*` 场地、
道路、绿地和其它未绑定对象不得成为可选中设备；点到这些对象时返回空 Selection。

用户点击产生的黄色 highlight 直接稳定显示，不启动闪烁。内置演示剧本完成最后一站后
统一执行 `clear_scene_focus`，清除设备 Selection 和设备卡并返回全厂 Overview。

`semanticIds` 和 `semanticNodeIds` 必须唯一；`semanticSelectionIds` 可以重复，因为多个
部件共享一个完整业务实体。

## 5. 首屏与失败

- HTML 使用内联 critical style 和 loading state，在 JavaScript bundle 与完整 CSS
  加载前即显示“正在加载工业 3D 场景”。
- SEO 文字摘要始终由内联 `.sr-only` 规则隐藏。
- Scene ready 或错误界面挂载后移除 loading layer。
- 单个 tile 失败不得移除已提交 coverage；所有可见 tile 失败时显示明确错误。
- 配置了其它 Asset 时失败不得静默切回默认污水处理厂。

## 6. 发布验证

```bash
npm run verify
PLAYWRIGHT_CHANNEL=chrome npx playwright test --project=chromium
```

浏览器 E2E 必须验证设备 Selection、黄色高亮、分块 Tileset 加载、内联 loading 和服务端/
本地 transport。

## 7. 关联文档

- `ICE3-AGENT-ARC-001` — [应用架构](../architecture.md)
- `ICE3-AGENT-GUIDE-004` — [接入其它 3D 模型](../guides/other-models.md)
- `ICE3-ENG-GUIDE-002` — [Asset 加载](https://github.com/ice-3d/ice3-engine/blob/main/docs/guides/asset-loading.md)
- `ICE3-STUDIO-REF-005` — [Studio 资产流水线](https://github.com/ice-3d/ice3-studio/blob/main/docs/reference/asset-pipeline.md)
