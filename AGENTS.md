# AGENTS.md

本文件用于约束本仓库内的 **Claude / Codex / Gemini** 在编码、重构、目录分层、命名、测试与文档方面的统一行为。除非另有明确说明，所有智能体驱动的变更都必须遵守本文件。

项目目标（必须遵守）：

- 仅沿用 JHipster 作为“工程脚手架/构建链路/后端基础”，**前端 UI/布局/颜色/交互完全重做**
- **不得参考当前仓库内既有前端页面的布局、样式与组件组织方式**（将其视为 legacy）
- JHipster 自带的后台管理/实体 CRUD UI **全部舍弃**（UI 层面不再使用/扩展）
- 所有功能与页面以 `docs/requirements/**` 与 `docs/specs/**` 为准，本文件仅约束工程与结构，不写具体需求

---

## 0. 权威文档与约束层级（必须遵守）

优先级从高到低：

1. `AGENTS.md`：工程规则、流程约束、质量门槛（最高优先级）
2. `docs/requirements/**`：需求与范围边界
3. `docs/specs/**`：接口、数据结构、页面 IA 与交互约束
4. `docs/ui-lockfiles/**`：页面/功能的 tokens、布局参数、组件边界、交互细则与验收清单
5. 现有代码 / JHipster 默认约定：仅作为构建与后端基座参考（最低优先级）

冲突处理：如果需求/spec/lockfile 与现有实现不一致，**以文档为准**；禁止以“现有代码就是这样”为依据继续扩展旧模式。

---

## 1. 强制执行流程（每次任务都要走）

1. **读取上下文**：定位将要改动的模块与目录边界（site/platform/legacy）
2. **检索与落盘**：先跑 UI/UX skills 检索，并把结果写入对应 Lockfile（见第 2 章）
3. **先输出计划**：变更范围、文件清单、测试清单、风险点
4. **再实现**：严格按目录落位与 tokens 规则实现
5. **自检并记录**：至少 lint / format / test（或写明替代验证步骤）

> 阻断规则：**没有对应 UI Lockfile（或 Lockfile 未补全检索记录/验收清单），禁止进入实现。**

---

## 2. 前端工作流（强制）：先检索 → 再实现 → 最后自检

### 2.1 Retrieve（检索阶段：必须先做，禁止跳过）

#### 2.1.1 UI/UX Pro Max Skills 检索（强制）

本项目实际脚本路径（必须使用）：

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> --max-results <N>
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack react --max-results <N>
```

可用 domain（以脚本 help 为准，严禁擅自扩展）：

- style, prompt, color, chart, landing, product, ux, typography

说明：本 skills 不提供 a11y/performance domain

- 可访问性（键盘/焦点/跳转链接/动效克制）必须用 `--domain ux` 覆盖
- 性能体验方向（信息密度/交互质感取向）用 `--domain product`
- 工程性能手段（虚拟列表/懒加载/避免无意义 effect/Profiler）用 `--stack react`

每次前端任务最低检索要求（不得少于）：

- domain：`ux` 至少 2 次查询（布局稳定 + 反馈/键盘）
- domain：`typography` 至少 1 次查询
- domain：`color` 至少 1 次查询
- domain：`product` 至少 1 次查询
- stack：`react` 至少 2 次查询（性能与工程模式）

输出必须沉淀进 Lockfile（强制）：

- 记录命令
- 命中摘要（3–5 条）
- 可执行规则（>=3）
- 风险点（>=1）

推荐使用 `--json` 输出以便审计与复用：

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "split layout left panel right canvas" --domain ux --json --max-results 8
```

#### 2.1.2 目标页面拆解（强制）

每个页面/功能必须在 Lockfile 参数化拆解并锁定：

- layout：分栏、滚动策略、固定区策略（sticky/fixed）、画布占位与尺寸稳定（CLS）
- typography：字体选择与字号阶梯
- color：品牌色/背景/文本/边框/状态色/选中高亮
- components：组件清单与职责边界（Container/Presentational）
- interactions：状态机（求解/校验/导出）、选中联动、编辑反馈
- verification：验收清单（可勾选）

---

## 3. Greenfield 重写护栏（最关键）

- **禁止参考/复用现有前端页面的布局、样式、组件组织方式**（legacy：`entities/`, `modules/`, `shared/` 等下的现有 UI）
- **禁止复用 JHipster admin/entities CRUD UI 的页面与布局组件**
- 允许复用仅限：构建链路、路由挂载入口、与 UI 无关的工具（需审查是否绑定旧 UI）

---

## 4. 前端目录落位与隔离（强制）

你当前目录为：

- `src/main/webapp/app/entities/`
- `src/main/webapp/app/modules/`
- `src/main/webapp/app/shared/`

为实现“前端彻底重做”且不污染 legacy，约定新增并强制使用以下目录（如不存在则创建）：

- `src/main/webapp/app/site/**`：新产品 UI（装箱页面、3D 视图、编辑器、导出等）
- `src/main/webapp/app/platform/**`：与 UI 风格无关的基础设施（http/i18n/routing/security 等）
- `src/main/webapp/app/legacy/**`：可选，用于逐步搬迁/隔离旧 UI（避免智能体误用）

禁止：

- 将新 UI 写入 `entities/**`、`modules/**`、旧 `shared/**`（均视为 legacy UI 区）
- `app/site/**` import legacy UI 目录（建议后续用 ESLint `no-restricted-imports` 硬限制）

---

## 5. Tokens 与样式（强制）

- Design Tokens 的唯一权威来源：`src/main/webapp/app/site/theme/**`
- 禁止在组件内硬编码大范围：颜色、字号、间距、圆角、阴影、z-index（必须走 tokens/CSS variables）
- 必须建立 z-index scale（例如 10/20/30/50），禁止 `z-[9999]`
- 必须规避 CLS：图片/画布/3D 容器需固定尺寸或 `aspect-ratio`；异步内容使用 skeleton 并预留空间
- 字体加载需 `font-display: swap` + 合理 fallback，避免字体加载导致 layout shift

---

## 6. 表单、可访问性与交互反馈（强制）

- 禁止 placeholder-only 表单；所有输入必须有可见 label 且可关联（for/id 或包裹）
- 任何异步操作（求解/校验/导出）必须有状态机：Idle/Loading/Success/Error，并提供可重试路径
- 所有功能必须键盘可达：
  - Tab 顺序与视觉顺序一致
  - 明确 focus ring（禁止 `outline-none` 而不提供替代）
  - 提供 skip link（对导航较重的页面）

---

## 7. 性能与工程护栏（强制）

- 列表 > 100 项必须虚拟化（react-window/react-virtual 等）
- 重组件（3D Viewer/编辑器）必须 lazy load（React.lazy）
- 禁止把高频状态（拖拽坐标、相机每帧变化等）塞进全局 React state，避免全树重渲染
- 优先 Container/Presentational 分离 + 自定义 hooks 抽离可复用逻辑
- 避免无意义 `useEffect`（不要为派生数据用 effect）

---

## 8. UI Lockfile 规则（阻断门槛）

- 路径：`docs/ui-lockfiles/<page-or-feature>.md`
- 无 Lockfile 或 Lockfile 未补全检索记录与 Verification：**不得进入实现**
- 每次新增页面或可感知 UI 功能模块，必须新增/更新对应 Lockfile，并在提交说明中引用其路径

---

## 9. 最低质量门槛（每次变更必须满足其一）

按变更范围选择执行并记录结果：

- 前端：`npm test`、`npm run lint`、`npm run prettier:check`
- 后端：`./mvnw test`（推荐 `./mvnw verify`）
- 涉及构建链路：`./mvnw -Pprod clean verify`

若无法执行，必须记录：原因、风险点、建议替代验证步骤。

---
