# Next Steps — Container Packing MVP（可执行计划）

本文件用于指导 Claude/Codex/Gemini 按仓库 AGENTS.md 与 docs/* 约束推进到“可跑闭环”。

## 0. 约束与前置

- 仅沿用 JHipster 作为构建与后端基座；前端 UI 全部走 Greenfield（禁止参考 entities/admin/shared legacy UI）。
- 新 UI 必须落在：`src/main/webapp/app/site/**`
- 平台层（与 UI 风格无关）落在：`src/main/webapp/app/platform/**`
- 无对应 UI Lockfile 不得实现页面/模块。
- 每个 PR 必须：
  - 引用 Lockfile 路径
  - 给出 Verification 勾选结果
  - 给出最小验证命令输出/说明（lint/test/build）

## 1. 目标：先跑通“最小闭环”（不含真实 3D，不含真实算法）

### 1.1 交付定义（PR#1）

实现一个可访问的 “Packing Workbench” 页面：
- 左侧：容器输入 + 货物输入（最小字段）+ 求解按钮 + 导出按钮
- 右侧：Canvas/Viewer 占位容器（固定尺寸，避免 CLS）
- 状态机：Idle → Validating → Solving → Solved → Error
- API：先用 mock 或 stub 跑通（允许后端返回固定 placements）
- 导出：至少 JSON + CSV（本地生成下载）

### 1.2 文件与目录（PR#1）

必须新增目录：
- `src/main/webapp/app/site/`
- `src/main/webapp/app/platform/`

推荐结构（可按 AGENTS 精简版要求落地）：
- `app/site/entry/`：site 入口挂载
- `app/site/routes/`：site 路由定义
- `app/site/pages/packing/`：PackingPage
- `app/site/theme/`：tokens（初版可只含少量变量）
- `app/platform/http/`：API 封装（可选）

路由挂载：在 `app/routes.tsx` 或等价入口中新增 `/packing` 或 `/site/packing` 路由，默认可暂定 `/packing`。

### 1.3 UI/交互硬要求（来自 lockfiles 与 skills）

- 布局稳定：右侧画布容器必须预留空间，避免 Content Jumping/CLS。
- 表单：每个输入必须有可见 label，禁止 placeholder-only。
- 提交反馈：求解按钮必须有 loading / success / error 反馈。
- z-index：建立有限等级，不允许随意 9999。
- 列表 >100：必须虚拟化（MVP 可先不做长列表，但需预留策略）。
- heavy 组件：3D viewer 后续必须 lazy load（PR#2）。

### 1.4 最小验收（PR#1）

- [ ] 进入 Packing 页面不报错，左右分栏稳定
- [ ] 填写容器与货物点击“求解”出现 loading，并返回结果态
- [ ] 结果态显示 metrics（利用率、装入件数等）与明细列表（最小）
- [ ] “导出 JSON / CSV”可下载，内容符合 `docs/specs/api.md` 的 schema
- [ ] i18n：site.* 前缀（如项目已有 i18n 机制），至少 zh-cn 可用
- [ ] 执行最小工程检查：`npm run lint`、`npm test`（或说明替代验证）

## 2. 目标：接入真实 API + 算法（PR#2）

- 后端新增 `POST /api/packing/solve`（按 `docs/specs/api.md`）
- 求解器按 `docs/specs/packing-algorithm.md` 的 MVP 启发式实现
- 增加超时策略（best-effort 返回当前最好解）
- 增加基本输入校验与错误码

验收：
- [ ] 相同输入+seed 输出可复现
- [ ] 非法输入返回 VALIDATION_ERROR
- [ ] 超时返回 SOLVER_TIMEOUT 或 best-effort 标识

## 3. 目标：3D Viewer（PR#3）

- 右侧占位替换为真实 three viewer（按 `docs/ui-lockfiles/three-viewer.md`）
- 必须 lazy load（React.lazy）
- 支持：相机 orbit、选中高亮、列表 ↔ 3D 选中联动、重置视角
- 性能：避免将相机每帧变化写入全局 state

## 4. 目标：手动摆放（PR#4）

- 按 `docs/ui-lockfiles/manual-editing.md`
- 拖拽移动 + 90°旋转
- 碰撞/越界检测：不允许保存非法状态
- 键盘替代：方向键微移、R 旋转、Esc 取消

## 5. 统一注意事项

- 任何新增依赖（3D 库、虚拟列表库等）如影响较大，写 ADR。
- 禁止从 `entities/`、`shared/`、`modules/` 的 legacy UI 复制布局/组件。
- 所有页面实现必须同步更新对应 `docs/ui-lockfiles/*.md` 的 Verification 勾选。
