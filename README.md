# ICE3 Agent Console

> Document ID: ICE3-AGENT-RM-001
>
> Status: Active
>
> Owner: ICE3 Agent Console maintainers

[![在线演示](https://img.shields.io/badge/demo-live-2ea44f)](https://ice-3d.github.io/ice3-agent-console/)

**一句话：让 Agent 用几个小而严格的工具，操作一座真实规模的工业 3D 厂区。**

左边是 3D 场景，右边是对话。你说"把二次沉淀池的刮泥机拉近看看"，Agent 调用
`focus_equipment`，相机飞过去、设备高亮、信息面板打开；场景在对话和状态更新时始终保持挂载，
不会闪一下重来。

场景是一座**完全虚构**的市政污水处理厂，来自 ICE3 Studio 的真实导出，不是示意图。

## 1. 它演示什么

| 主题 | 做法 |
|---|---|
| 对话 | 流式文本、工具调用、运行错误与取消 |
| Scene | 设备发现、选择、聚焦、高亮、相机视角、清除焦点 |
| 渲染 | WebGL2 默认；PBR 材质（底色/法线/ORM 贴图）、环境遮蔽、方向光阴影 |
| 传输 | 浏览器本地确定性脚本 Agent（离线可用）或服务端事件流（接真实模型） |
| 相机 | 多站点引导巡游、响应式舞台取景 |
| 选择 | 鼠标拾取走稳定黄色高亮；地面、道路与未绑定业务实体不可选 |
| 加载 | Studio Tileset fine/coarse 分块、设备绑定、按需驱逐 |
| 首屏 | 内联 loading，在完整 CSS/JS 之前就能稳定显示 |
| 部署 | 服务端开发模式 + 无凭据静态演示（`build:demo`） |

本工程是**应用层**：只依赖公开的 `ice3` API，不向 engine 或 industrial core 增加任何
Agent 概念。换一座厂只需换资产，见 [接入其它 3D 模型](docs/guides/other-models.md)。

## 2. 快速开始

需要 Node.js 24.22.1 LTS、npm 11+、支持 WebGL2 的浏览器。

```bash
git clone https://github.com/ice-3d/ice3-agent-console.git
cd ice3-agent-console
nvm use && npm install
npm run dev
```

- 应用：<http://127.0.0.1:8110/>
- Agent 服务：<http://127.0.0.1:8099/>

Scene 加载完成后自动开始总览巡游。没有 API key 也能跑——本地脚本 Agent 是确定性的，
内置分组剧本与快捷操作（清单见 `shared/scenarios.ts`）。

只想看静态演示（不要服务端）：

```bash
npm run build:demo
npx http-server dist -p 8111 -c-1     # → http://127.0.0.1:8111/
```

线上版本就在 <https://ice-3d.github.io/ice3-agent-console/>，由
`push main` 触发的 GitHub Actions 构建部署。

## 3. 接真实模型（可选）

这里的 "Real-Model" 指 AI 推理服务，不是 3D 模型。三个变量配齐即可：

```bash
export ICE_AGENT_MODEL_BASE_URL='https://model.example/v1'
export ICE_AGENT_MODEL_API_KEY='replace-with-your-secret'
export ICE_AGENT_MODEL_NAME='industrial-agent'
npm run dev
```

API key 只保留在服务端，`/health` 只报告运行模式与接口 host，不回传凭据。模型配置了但
不可用时会**报错**，不会静默退回脚本输出。详见
[Real-Model 服务端](docs/guides/real-model-server.md)。

## 4. Agent 能用的工具

只有这六个，未知工具会被拒绝；参数不合法只报错不执行。

| 工具 | 作用 |
|---|---|
| `find_equipment` | 按名称/标签/阶段查找设备 |
| `select_equipment` | 选中并高亮 |
| `focus_equipment` | 相机对准该设备 |
| `highlight_equipment` | 只高亮，不动相机 |
| `set_camera_view` | 切到预设视角（总览、工艺段等） |
| `clear_scene_focus` | 清除焦点与高亮 |

协议与事件格式见 [事件和 Scene 工具协议](docs/reference/protocol.md)。

## 5. 演示资产从哪来

`public/assets/wastewater-plant` 是 **ICE3 Studio 导出的副本**，随仓库提交（当前约 44 MB，
含 fine/coarse 分块与 15 张贴图）。它记录的是演示世界本身，所以必须一起进版本库。

更新它需要同级的 studio 仓库：

```bash
# 先在同级 studio 仓库：cargo build -p studio-cli
npm run assets:sync     # 调 studio-cli 重新导出 → 换目录 → 重生成 equipment.json → 自检
npm run assets:check    # 只校验已提交的资产（CI 和单测都会跑）
```

- CLI 定位顺序：`STUDIO_CLI_BIN` → 同级仓库 `target/release` / `target/debug` 中**最新构建**的那个。
- 导出必须带 `--asset-id ice3-virtual-wwtp`。身份一变，设备清单与内置剧本全部失配。
- `assets:check` 会查：资产身份三处一致、每个贴图槽位指向的文件真实存在、至少一个材质带
  normal 与 ORM。**它挡住过一次真实事故**——仓库里躺着一份贴图之前的导出，页面照常能开，
  只是材质全平。

## 6. 命令

| 命令 | 用途 |
|---|---|
| `npm run dev` | 应用 + Agent 服务（8110 / 8099） |
| `npm run dev:web` | 只起前端 |
| `npm run dev:api` | 只起 Agent 服务 |
| `npm run build` | 生产构建（含服务端） |
| `npm run build:demo` | 静态演示构建（无服务端，可部署） |
| `npm run assets:sync` / `assets:check` | 同步 / 校验演示资产 |
| `npm test` | 单元测试（Node test runner） |
| `npm run test:e2e` | Playwright 端到端 |
| `npm run typecheck` | 前端 + 服务端类型检查 |
| `npm run verify` | 上面这些的组合门禁 |

URL 参数：`?demo=1|0` 切换本地/服务端传输，`?autoplay=1|0` 控制开场巡游，
`?shadows=0` 关阴影，`?ao=off` 关环境遮蔽。非法值回退到构建默认值。

## 7. 给 AI Agent 的约定

**必须遵守**

1. 依赖的 `ice3` 是 npm 上的**准确版本**，且有测试钉住（`tests/package-version.test.ts`）。
   升级引擎 = 改 `package.json` + 该测试 + 跑 `npm install` 更新 lock，三处一起。
2. 资产改动只能走 `npm run assets:sync`，不要手改 `public/assets` 下的 GLB 或 JSON。
   改完必须提交资产本身——CI 部署的是仓库里的副本，不是 Studio 工程。
3. 断言"完成"之前跑 `npm run verify`。CI 的部署流水线在 `Run unit tests` 就守门，
   它红一次线上就落后一次（真实发生过）。
4. 场景语义（设备标签、阶段、材质槽）在 `scripts/generate-equipment-manifest.mjs` 里，
   `equipment.json` 是产物。不要手写它。
5. 文档改动同步 `docs/README.md` 索引，否则 `docs:check` 失败。

**找东西的最短路径**

| 想知道 | 去哪 |
|---|---|
| 应用怎么组织 | `docs/architecture.md`、`src/` |
| Agent 协议与工具 | `docs/reference/protocol.md` |
| 本地确定性 Agent 剧本 | `src/agent/`、`shared/` |
| 资产交付格式 | `docs/reference/asset-delivery.md` |
| 部署流程 | `.github/workflows/deploy-pages.yml` |

## 8. 文档

- [文档索引](docs/README.md) · [应用架构](docs/architecture.md)
- 指南：[本地开发](docs/guides/local-development.md) · [静态部署](docs/guides/static-deployment.md) · [Real-Model 服务端](docs/guides/real-model-server.md) · [接入其它 3D 模型](docs/guides/other-models.md)
- 参考：[协议](docs/reference/protocol.md) · [Runtime Asset 交付](docs/reference/asset-delivery.md)
- [架构决策](docs/decisions/README.md)

## 9. 许可证

[MIT](LICENSE)
