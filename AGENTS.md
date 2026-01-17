# AGENTS.md

本文件用于约束本仓库内的 **Claude / Codex / Gemini (Google Antigravity) / 其他大模型智能体** 在编码、重构、目录分层、命名、测试与文档方面的统一行为。除非另有明确说明，所有智能体驱动的变更都必须遵守本文件。

仓库背景（固定事实）：

- 脚手架：JHipster（**单体 Monolith**）
- 后端：OpenJDK 21 + Spring Boot
- 前端：React + TypeScript（JHipster 前端基座存在，但 **UI 视为 legacy**）
- 目标：后续大量依赖大模型协作编码，但必须“可审计、可回滚、可评审”。

项目目标（必须遵守）：

- 仅沿用 JHipster 作为“工程脚手架/构建链路/后端基础”，**前端 UI/布局/颜色/交互完全重做**
- **不得参考当前仓库内既有前端页面的布局、样式与组件组织方式**（将其视为 legacy）
- JHipster 自带的后台管理/实体 CRUD UI **全部舍弃**，后续如需“后台/控制台”必须按新的需求与分层重新开发
- 所有功能与页面以你后续写入 `docs/requirements/**` 与 `docs/specs/**` 的定义为准，本文件仅约束工程与结构，不写具体业务需求

## 项目范围护栏（Hard Scope Guardrails：必须遵守）

本仓库产品定位为“最小可用装箱优化器（Packing Optimizer MVP）”。目标是：**输入货物信息 → 算法求解最优/近似最优装载方案 → 3D 展示 → 支持手动微调 → 导出结果**。除非 `docs/requirements/**` 明确新增，否则禁止扩展范围。

### In Scope（必须实现的最小闭环）

1. 货物输入：尺寸（L/W/H）、重量、数量；可选约束：可旋转、可堆叠/禁压、优先级（最小集即可）。
2. 容器输入：标准容器库 + 自定义容器（内尺寸、载重上限）。
3. 求解：使用数学建模/启发式算法生成最优或近似最优方案，必须输出可解释评分（至少：体积装载率、剩余体积/空隙、约束满足情况）。
4. 3D 输出：在页面中 3D 可视化装载结果（旋转/缩放/平移、选中高亮、列表定位到 3D 物体）。
5. 手动摆放：支持拖拽移动、旋转、吸附对齐（可先做基础吸附）；必须提供**碰撞/越界/超重**校验（前端即时或后端校验均可，但必须可用）。
6. 导出：至少支持以下导出（MVP 强制）  
   - `plan.json`：输入参数 + placements（可复算）  
   - `items.csv` 或 `items.xlsx`：装载清单（货物编号、箱号、坐标、朝向、尺寸、重量）  
   - `view.png`：3D 截图（至少 1 个视角）

### Out of Scope（明确不做；除非 requirements 指定）

- 运输/物流：询价、比价、委托、跟单、结算、供应商管理、邮件询价
- 多组织/复杂权限/审批流（MVP 仅允许最小登录或匿名模式；以 requirements 为准）
- 移动端仓库作业指导、扫码、离线执行
- CMS/营销官网/SEO 全家桶（除非明确提出）
- 多容器协同、复杂装载工艺（绑带、隔板、加固）等高级能力（后续迭代再做）

### 复杂度控制（强制）

- 禁止因为“看起来更完整”而引入额外模块或页面。
- 任何新增依赖或新增模块，必须：  
  1) 在 `docs/requirements/**` 写明范围与验收；  
  2) 若引入新库/改动架构边界，写 `docs/adr/**` 说明必要性、替代方案与取舍。



---

## 0. 权威文档与约束层级（必须遵守）

### 0.1 约束层级（从高到低）

1. `AGENTS.md`（本文件）：工程规范、目录/命名/质量门槛（最高优先级）
2. `docs/requirements/**`：需求/范围/验收
3. `docs/specs/**`：UI 信息架构、API 契约、权限模型、SEO/性能口径
4. `docs/ui-lockfiles/**`：前端 UI Lockfile（每个页面/功能模块必须一份；无 Lockfile 不得进入实现）
5. `docs/adr/**`：架构决策记录（新增依赖/大改结构必须写 ADR）
6. JHipster 默认约定与仓库现有实现（仅作为“构建与后端基座”的参考）

冲突处理：如果需求文档与现有代码实现不一致，**以需求文档为准**；禁止用“现有代码就是这么写的”作为依据继续扩展旧模式。

### 0.2 文档目录要求（若缺失则创建骨架）

- `docs/requirements/PRD.md`
- `docs/requirements/acceptance.md`
- `docs/specs/ui.md`（页面 IA、导航结构、组件约束、A11y/性能目标入口）
- `docs/specs/api.md`
- `docs/specs/security.md`
- `docs/specs/seo.md`（官网 SEO/性能/可访问性、CLS/LCP 指标口径）
- `docs/adr/0001-*.md`
- `docs/ui-lockfiles/`（前端 UI Lockfile 目录；模板与每个 feature/page 的 lockfile 均放此目录）
- `docs/dev/`（可选：本地开发、CI、环境变量、运行方式说明）

---

## 1. 智能体通用工作方式（必须执行）

### 1.1 默认执行流程（每次任务都要走）

1. **读取上下文**：定位将要修改/新增的模块目录与现有工程约束（构建、lint、i18n、路由入口、权限边界）
2. **先输出计划**：变更范围、文件清单、迁移清单、测试清单、风险点（必须显式列出）
3. **再编码实现**：严格按本文件分层落位；禁止把新代码塞进 legacy UI 目录中
4. **补齐测试与文档**：至少更新对应 specs（如涉及路由/导航/SEO/权限/接口）并补最小测试
5. **自检**：lint/test/build（至少覆盖本次改动相关链路）并记录结果

### 1.2 变更风格（强制）

- **小步提交**：一次 PR 只做一类事（新增页面/重构/引入依赖/接口契约变更不得混杂）
- **可回滚**：禁止“一把梭”全仓重排、全量格式化、无差别重构
- **显式约束**：涉及全局路由、主题、鉴权、Liquibase、依赖引入必须先写计划/必要时写 ADR

---

## 2. 前端“Greenfield 重写”硬规则（最关键）

### 2.1 Legacy UI 一律视为不可参考

- **禁止参考当前项目现有前端页面**的布局、颜色、组件切分、菜单组织与路由结构（将其视为 legacy）
- **禁止复用 JHipster 自带管理后台/实体 CRUD UI 的页面与布局组件**
- 允许复用的仅限：
  - 通用工程设施：构建链路、TypeScript 配置、路由挂载入口（作为容器）、i18n 基础设施
  - 与 UI 无关的基础工具：日期/字符串工具、通用类型定义（需审查是否绑定旧 UI）
- 任何 UI 相关实现必须以 `docs/specs/ui.md` 的 IA 与组件约束为准；若 specs 不完整，先补 specs 再实现。

### 2.2 UI/UX Pro Max Skills 驱动（强制）

- 所有新 UI 必须以 “UI/UX Pro Max Skills” 的检索产物与 Lockfile 为依据，禁止“凭感觉堆 UI”
- 每个页面/模块必须先完成检索与结构化拆解并落盘（见第 3 章）

---

## 3. 前端工作流（强制）：先检索 → 再实现 → 最后自检

> 本章节是前端任务的硬性流程。所有前端变更（新增页面、重构、样式调整、导航调整、主题令牌、组件库引入、性能优化等）必须遵循本流程。

### 3.1 Retrieve（检索阶段：必须先做，禁止跳过）

在写任何 UI 代码之前，必须完成两类检索，并落盘为可审计产物（见 3.2 UI Lockfile）。

#### 3.1.1 UI/UX Pro Max Skills 检索（强制）

目标：从技能库中提取可执行规则，避免“拍脑袋写 UI”。

推荐脚本（以仓库实际路径为准；若缺失则创建占位并在 ADR 记录来源）：

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack react [-n <max_results>]
```

要求：

- 每次前端任务至少完成一轮检索（domain 检索 + stack 检索）
- 输出必须沉淀进 Lockfile（关键词、命令、命中摘要、可执行规则）

最低检索域（不得少于）：

- product / style / typography / color / landing / ux / a11y / performance
- stack: react

最低输出要求（写入 Lockfile）：

- 每个 domain 至少：**3 条可执行规则 + 1 条反模式/风险点**

#### 3.1.2 目标体验“参数化拆解”（强制）

目标：把“UI 重新设计”变成参数化约束（tokens + 组件清单 + 交互清单），可评审可复现。

拆解项必须覆盖：

- Layout：container max-width、breakpoints、grid、gutter、section padding、关键组件间距
- Typography：字体栈、字号阶梯（nav/H1/H2/H3/body/caption）、字重、行高
- Color：背景/正文/弱文本/分隔线/CTA/hover/focus（以 token 表述）
- Component Inventory：Header/Nav、Hero、Cards、Tabs、Tables、Forms、Modal/Drawer、Footer 等
- Interaction：hover、展开收起、滚动行为、动效时长与 easing、键盘操作规则
- Asset Rules：图片比例、懒加载策略、LCP/CLS 约束

> 注意：本项目不要求“复刻某站”，而是要求“由 UI/UX Pro Max Skills 驱动的全新设计”。拆解对象可以是你在 `docs/specs/ui.md` 指定的对标体验或内部设计基线。

---

### 3.2 UI Lockfile（强制产物：没有就不准进入实现）

固定路径（不得另起位置）：

- `docs/ui-lockfiles/<page-or-feature>.md`
- 模板：`docs/ui-lockfiles/_template.md`

规则：

- 每次新增页面或可感知 UI 功能模块，必须新增/更新对应 Lockfile
- 任务开始时必须先检查 Lockfile 是否存在；不存在则先按模板创建，再进入 Implement
- Lockfile 字段必须完整（缺字段即视为未完成检索/未完成拆解/不可实现）

Lockfile 必须包含以下字段（不得省略）：

1. Feature / Page 名称与范围（只写结构与边界，不写业务细节）
2. UI/UX Pro Max 检索记录（每个 domain：关键词 + 摘要 + 3 条规则 + 1 风险点）
3. 参数化拆解结果（layout / typography / color / components / interactions）
4. 设计令牌（Design Tokens）：colors / typography / spacing / radius / shadow / z-index / breakpoints
5. 组件清单与职责边界（layout / sections / components）
6. 文案与 i18n 策略（`site.*` 前缀；中英双语）
7. 图片占位策略（比例、width/height、懒加载、目录/命名）
8. Verification（验收自检清单：见 3.4）

---

### 3.3 Implement（实现阶段：严格按 Lockfile 落地）

#### 3.3.1 目录落位（强制）

- 所有新官网/新前台 UI 必须落在：`src/main/webapp/app/site/**`
- 平台层（与 UI 风格无关的工程设施）可放在：`src/main/webapp/app/platform/**`
- 禁止把新 UI 写进 legacy/admin/entities/旧 shared layout 等目录

#### 3.3.2 Theme 与 Tokens（强制）

- 必须建立并使用 `app/site/theme/**`（Design Tokens 的唯一权威来源）
- 颜色/间距/字体/圆角/阴影不得在组件内硬编码魔法值
- 例外极少：仅允许“计算型值”，必须注释原因，并在 Lockfile 记录

#### 3.3.3 文案与 i18n（强制）

- 官网 i18n key 统一前缀：`site.*`
- 双语必须同时存在：`zh-cn` 与 `en`
- 禁止在组件中硬编码长文案；所有可见文本必须 i18n（短 label 也必须）
- 图片可占位，但不得改变布局结构与比例约束（避免 CLS）

---

### 3.4 Self-check（自检阶段：必须完成并记录）

每次前端变更必须完成以下自检，并把结果写入 PR 描述或 Lockfile 的 Verification 小节。

#### 3.4.1 视觉一致性自检（必须）

- 栅格/间距：container、breakpoints、gutter、section padding 与 Lockfile 一致
- 字体层级：nav/H1/H2/body/caption 的 size/weight/line-height 一致
- 颜色：背景/边框/分隔线/CTA/hover/focus 一致（以 token 为准）
- 阴影/圆角：卡片与浮层（下拉/弹层）一致
- 动画：hover/展开收起/滚动联动的 duration/easing 一致

#### 3.4.2 功能完整性自检（必须）

- 导航：打开/关闭、hover、键盘可达（Tab/ESC）
- 语言切换：中英切换后导航/按钮/关键文本一致
- 路由：所有入口可达正确页面（未完成页面允许占位路由，但必须有明确占位组件）
- A11y：aria-label、focus ring、对比度、可点击区域（建议 >= 44px）

#### 3.4.3 工程门槛（必须）

至少执行与本次变更相关的最小集合：

- `npm run lint`
- `npm run prettier:check`
- `npm test`（或给出明确替代验证步骤）

失败必须记录：原因、风险点、建议验证步骤。

---

## 4. 前端工程硬门槛与护栏（强制）

### 4.1 Legacy Isolation（强制）

目标：避免新 UI 被旧代码“污染”，防止智能体为了省事引用 legacy UI。

- `app/site/**` 禁止 import：
  - `app/entities/**`
  - `app/admin/**`
  - 旧 `shared/layout/**`（如存在）
  - 任何 JHipster 自带 UI 目录（以仓库实际路径为准）
- 允许共享能力的唯一方式：
  - 通过 `app/platform/**` 提供 **与 UI 风格无关** 的抽象（http/i18n/routing/security 等）
- 强烈推荐（如可行）：
  - ESLint `no-restricted-imports` 对上述路径做硬限制  
  - 若新增 ESLint 插件/规则导致依赖变化，必须写 ADR（见第 12 章）

### 4.2 SEO & i18n Engineering Rules（强制）

具体 SEO 策略与字段定义以 `docs/specs/seo.md` 为准；本节定义最低工程门槛。

- 每个 `site` 页面必须提供：
  - `title`
  - `meta description`
  - OG tags（至少 `og:title`/`og:description`/`og:type`）
- i18n：
  - 禁止硬编码长文案；中文/英文必须齐全
  - 缺失翻译必须有明确 fallback 策略，并记录在 Lockfile
  - 所有 `site` 文案 key 必须以 `site.*` 为前缀

### 4.3 Accessibility (A11y) Rules（强制）

- 目标标准：**WCAG 2.1 AA（最低）**
- 所有可交互元素必须：
  - 键盘可达（Tab/Shift+Tab）
  - 可见 focus 样式（不得移除 outline，除非提供等效替代）
  - 语义/ARIA 正确（按钮/链接/菜单/对话框等）
- 弹层/抽屉/菜单：
  - 必须支持 ESC 关闭
  - Tab 顺序可预测，并在 Lockfile 的 Interactions 中定义

### 4.4 Performance Budgets（强制）

性能目标与测试方法以 `docs/specs/seo.md` 或 `docs/specs/performance.md`（如新增）为准。本节定义最低护栏。

- 每个新页面/模块必须在 Lockfile 中声明：
  - 首屏 LCP 目标元素与加载策略
  - CLS 风险点与规避措施（width/height 或 aspect-ratio）
  - 可懒加载资源与不可懒加载资源
- 禁止在没有 ADR 的情况下引入会显著增加首包体积的依赖（组件库/动画库/图标库/图表库/富文本等）

### 4.5 Design Tokens Format（强制）

- Tokens 必须在 `app/site/theme/**` 统一定义（唯一权威来源）
- 必须采用“tokens → CSS variables → components”的链路：
  - tokens 文件中定义 CSS variables（或由构建过程生成）
  - 组件/样式只能引用 CSS variables（或 token 名），不得直接写 hex/rgb/px（除 tokens 文件本身）

---

## 5. 后端工程规范（JHipster 单体：继续沿用分层）

### 5.1 后端分层（严格）

- `web.rest`（Resource/Controller）→ `service` → `repository` → `domain`
- DTO/Mapper（如项目已采用）继续保持一致
- 禁止将业务逻辑堆在 Resource 层
- 任何 API 变更必须同步更新 `docs/specs/api.md`（契约优先）

### 5.2 安全与权限（强制）

- 任何鉴权/授权逻辑变更必须同步更新 `docs/specs/security.md`
- 禁止在前端仅靠隐藏按钮“实现权限”；必须后端 enforce

---

## 6. 前端目录布局（强制推荐结构）

目标：让“新 UI（全新设计系统）”与“legacy JHipster UI”彻底隔离，避免智能体误用旧页面。

### 6.1 核心目录（`src/main/webapp/app/`）

- `app/site/`：前台/官网/产品 UI（**全新 UI**）
  - `entry/`：站点入口容器（与 JHipster 全局挂载衔接）
  - `routes/`：站点路由定义与 lazy loading
  - `layout/`：Header/Nav/Footer 等（全新实现）
  - `pages/`：页面级目录（每个页面一个目录）
  - `sections/`：可跨页面复用的楼层区块
  - `components/`：通用展示组件（不携带业务）
  - `navigation/`：导航配置（强类型 + 双语映射）
  - `theme/`：设计系统（tokens / variables / typography / spacing）
  - `styles/`：站点样式（隔离）
  - `api/`：站点数据获取封装（页面不直接拼 URL）
  - `types/`、`hooks/`、`utils/`

- `app/platform/`：平台层/基础设施（与 UI 风格无关）
  - `http/`：请求封装、拦截器、错误处理
  - `i18n/`：i18n 基础能力与工具
  - `routing/`：路由装配工具
  - `security/`：前端鉴权守卫（如后续有 console 域）
  - `store/`：状态管理基础配置（如保留 Redux）

> 约束：所有“新 UI”只能落在 `app/site/**`（或未来新建 `app/console/**`）。禁止向 `entities/`、`admin/`、旧 `shared/layout` 等目录继续叠加 UI 功能。

### 6.2 页面目录模板（`site/pages/<page>/`）

- `index.tsx`：页面入口（默认导出 `XxxPage`）
- `sections/`：页面楼层（可选）
- `components/`：页面私有组件（可选）
- `__tests__/`（推荐）
- `types.ts` / `hooks.ts` / `utils.ts`（可选）

跨页面复用才上移到 `site/sections` 或 `site/components`。

---

## 7. 命名规范（必须统一）

### 7.1 Java 后端命名（严格）

- 实体：名词单数 PascalCase（`Order`, `ContainerType`, `PackingPlan`）
- Repository：`XxxRepository`
- Service：`XxxService`（实现类：`XxxServiceImpl`）
- DTO：`XxxDTO`
- Mapper：`XxxMapper`
- Resource：`XxxResource`
- 禁止随意缩写（行业缩写需在 `docs/specs/api.md` 定义）

### 7.2 前端命名（严格）

- 目录：kebab-case
- 页面组件：`XxxPage`
- 组件：PascalCase
- hooks：`useXxx`
- 路由 path：kebab-case（`/packing-plans`），参数 `/:id`、`/:slug`

---

## 8. 数据库与 Liquibase（强约束）

- 禁止修改已发布 changelog
- DB 变更必须新增 changelog，并写明目的、影响对象与回滚策略
- 复杂变更必须附带测试策略或迁移验证步骤（写入 PR 描述或 ADR）

---

## 9. 质量门槛（必须做到）

最低自检集合（按变更范围选择）：

- 后端：`./mvnw test`（推荐 `./mvnw verify`）
- 前端：`npm test` + `npm run lint` + `npm run prettier:check`
- 涉及生产构建链路：`./mvnw -Pprod clean verify`

无法执行必须写明：原因、风险点、建议验证步骤。

---

## 10. ADR 触发条件（必须写）

- 新增/替换 UI 基础库（例如引入组件库、CSS-in-JS、Tailwind、SSR/预渲染等）
- 全局主题系统调整、路由体系大改、权限模型变化
- 引入搜索、富文本、图表、下载中心、CMS 等跨域能力
- 引入新的 ESLint 插件/规则导致依赖变化（如 `no-restricted-imports`）

---

## 11. PR / 提交流程（强制）

- 所有前端变更必须通过 PR（禁止直接推送到主分支）
- PR 描述必须包含：
  - UI Lockfile 路径：`docs/ui-lockfiles/<page-or-feature>.md`
  - Verification 勾选结果（可直接引用 Lockfile 的 Verification 小节）
  - 工程门槛执行结果：lint / prettier / test（或替代验证步骤）
  - 视觉一致性证据：至少 3 张关键截图（导航/首屏/关键交互或表单/页脚）
- 未满足以上任一项，PR 视为不合格，不允许合并

---

## 12. 交付前自检清单（每次任务都要过）

- [ ] 未参考旧 UI 布局与风格；新 UI 仅落在 `app/site/**`
- [ ] 已按第 3 章执行“先检索 → 再实现 → 最后自检”，并新增/更新 UI Lockfile
- [ ] 满足第 4 章前端工程硬门槛（Legacy 隔离 / SEO&i18n / A11y / 性能 / Tokens）
- [ ] 主题令牌集中在 `site/theme/**`，未散落魔法色值/间距
- [ ] 导航集中在 `site/navigation/**`，双语可维护
- [ ] 旧 admin/entities UI 未作为入口或导航项出现
- [ ] i18n key 使用 `site.*` 前缀，未硬编码长文案
- [ ] 涉及 DB 变更：新增 changelog，未改历史
- [ ] 已跑最低测试集合或写明原因与风险
- [ ] 触发 ADR 条件时已新增 ADR
- [ ] PR 描述包含 Lockfile、验证结果与截图证据

---
