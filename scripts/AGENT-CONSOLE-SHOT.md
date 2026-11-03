# Agent Console 视觉验证脚本

> Document ID: ICE3-AGENT-GUIDE-005
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

## 1. 用途

对运行中的 Agent Console 做程序化视觉验证，供 Agent（或脚本）在没有人工开浏览器的
情况下检查渲染结果与对话交互。与 ice3-studio 的 `scripts/agent-screenshot.mjs` 配套。

- `scripts/agent-console-shot.mjs`：加载场景、等待舞台 canvas 出现并静置后截屏。用法：
  `node scripts/agent-console-shot.mjs [url] [out.png] [settleMs]`。
  默认 `http://127.0.0.1:8110/?demo=1&autoplay=0`，输出 `output/console-shot.png`。
- `scripts/agent-console-chat.mjs`：发送一条对话指令、等待流式回复与聚焦动画后截屏并
  打印对话尾部。用法：`node scripts/agent-console-chat.mjs "讲解深度处理" [out.png]`。
  URL 默认 `?demo=0&autoplay=0`（服务端剧本传输）。
- `scripts/flicker-hunt.mjs`：驱动相机旋转/缩放/静止并连拍帧，供帧间差异分析定位
  渲染闪烁。用法：`node scripts/flicker-hunt.mjs [outDir] [still|slow|rotate|zoom]`。

三个脚本都使用用户已安装的 Google Chrome（Playwright channel），console 与
HTTP >= 400 错误转发到 stderr 便于诊断，失败以非零退出码结束。

## 2. 验证记录

用 Studio `export tileset --profile agent-console-v1 --asset-id ice3-virtual-wwtp`
导出的 document 层工程替换演示资产后验证：

- 场景加载"场景已就绪"，51 台设备 bindings 与剧本 selectionId 命名空间对齐；
- AGUI `focus_equipment` 工具调用（CHEM-101-D → FL-101 → UV-101 → 出水口）与新资产
  全部命中；
- 总览渲染完整（池体、建筑、道路、管线）。

注意：`--asset-id` 必须与 `shared/demo-asset.ts` 的 `id` 一致，否则剧本聚焦失效
（Studio 侧 README 已同步记录该约定）。
