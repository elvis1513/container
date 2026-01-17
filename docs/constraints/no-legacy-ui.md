# No-Legacy-UI Policy（强制：前端完全独立设计）

本文件的目标：确保所有智能体（Claude/Codex/Gemini）在本仓库内 **不复用、不参考、不扩展** 任何现有 JHipster 前端 UI 实现，仅利用其构建链路与最小路由挂载能力。

## 1. 定义

### 1.1 Legacy UI（严格禁止复用/参考）
以下目录与其子目录内的任何 UI（布局、组件、样式、页面、hooks、工具）均视为 legacy：

- `src/main/webapp/app/entities/**`
- `src/main/webapp/app/shared/**`
- `src/main/webapp/app/modules/**`
- `src/main/webapp/app/config/**`（除非明确为非 UI 的纯配置）
- 任何现存的全局样式：`src/main/webapp/app/app.scss`、`_bootstrap-variables.scss`（允许保留构建，但**新 UI 不得引用其中的样式类**）

说明：允许在“挂载/构建层”读取现有代码以找到入口位置，但不得复制其布局结构、CSS、组件组织方式，也不得 import 任何 legacy UI 代码。

### 1.2 Greenfield UI（唯一允许新增 UI 的位置）
所有新前端 UI 必须只落在：

- `src/main/webapp/app/site/**`（官网/工作台等新 UI）
- `src/main/webapp/app/platform/**`（与 UI 风格无关的基础设施：http/i18n/routing/security）

除 `site/**` 与 `platform/**` 外，任何新增 UI 代码都视为违规。

## 2. 禁止事项（Hard Rules）

### 2.1 禁止 import（必须）
`app/site/**` 内 **禁止 import**：
- `app/entities/**`
- `app/shared/**`
- `app/modules/**`
- `app/config/**`（除非是“纯配置且无 UI 绑定”，需在 PR 中说明）

### 2.2 禁止复用样式（必须）
新 UI 不得使用 legacy 的 className、scss、bootstrap variables 或其派生样式。
新 UI 的样式与 tokens 必须在：
- `app/site/theme/**`
- `app/site/styles/**`（或你约定的隔离样式目录）

### 2.2.1 国际化（必须支持中英文热切换）
新 UI 必须支持**热切换**中英文（en/zh-cn），禁止只提供单一语言。
- 必须在 `app/platform/i18n/**` 实现独立的 i18n 系统
- 必须提供可见的语言切换器（按钮或下拉菜单），位置由产品/UX 约束确定
- 切换语言时所有文本必须实时更新，无需刷新页面

### 2.3 禁止复制布局与组件结构（必须）
禁止从 legacy 页面复制：
- 布局（header/sidebar/footer/grid）
- 组件拆分方式
- 路由结构与菜单结构
- 表单与表格的呈现方式

即使“看起来能用”，也视为违规。

## 3. 唯一允许复用的内容（允许但需审查）

允许复用仅限“工程设施层”，且推荐迁移到 `app/platform/**` 后再使用：

- http 客户端封装（如 axios 拦截器）——需确认不带 UI 错误弹窗耦合
- i18n 基础设施（仅底层，不含页面布局）
- 路由入口挂载（仅容器，禁止带 UI）
- 类型定义（确认不绑定 legacy UI）

## 4. 强制工程护栏（建议必须落地）

在 ESLint 中增加 `no-restricted-imports`：
- 限制 `app/site/**` 禁止从 `entities/shared/modules/config` import
- 若为落地该规则需要新增依赖/改 eslint 配置，必须写 ADR

## 5. 审核规则（PR Gate）

任何 PR 必须包含：
- 新 UI 仅出现在 `app/site/**`（与必要的挂载改动除外）
- `git diff` 中不存在从 legacy 目录复制来的组件/样式
- `app/site/**` 无违规 import（通过 lint 或手工检查）
