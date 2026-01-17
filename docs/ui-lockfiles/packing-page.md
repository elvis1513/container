# UI Lockfile: Packing Page（/packing）

> 范围：单页闭环 MVP。用户输入货物与集装箱信息 → 调用求解（算法）→ 输出装箱方案（3D + 列表）→ 支持手动摆放调整 → 支持导出（JSON/CSV/截图/可选报告）。

---

## 1. Feature / Page 范围与边界

### 1.1 包含（MVP 必须）
- 左侧输入面板：集装箱参数、货物列表（可批量导入/编辑）、约束（是否允许旋转/堆叠等）
- 右侧 3D 画布：展示装箱结果（箱体+货物），支持选中高亮、视角控制
- 手动摆放：对选中货物进行移动/旋转（MVP：按钮+输入框为主，拖拽为增强）
- 导出：导出装箱结果（JSON/CSV），并导出 3D 视图截图（PNG）作为最小可视证据
- 状态机：求解 Loading/Success/Error；导出前校验（越界/重叠）

### 1.2 不包含（MVP 不做）
- 多集装箱/多目标优化的复杂策略
- 复杂约束（温控、危险品隔离、优先级装载、多仓路径等）
- 协作、多用户实时编辑

---

## 2. UI/UX Pro Max Skills 检索记录（可审计证据）

> skills 域：style, prompt, color, chart, landing, product, ux, typography  
> stack：react

### 2.1 domain=ux：分栏布局（左面板 + 右画布）稳定性
- 关键词/命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "split layout left panel right canvas" --domain ux -n 8`
  - （已验证 json 输出可用）`python3 .claude/skills/ui-ux-pro-max/scripts/search.py "split layout left panel right canvas" --domain ux --json --max-results 8`
- 命中摘要（来自 ux-guidelines.csv）：
  1) Content Jumping：异步内容导致布局跳动非常干扰，必须预留空间（Severity: High）。
  2) Fixed Positioning：多个 fixed 容易遮挡或不可达，必须留安全间距（Severity: Medium）。
  3) Stacking Context：stacking context 会导致 z-index 失效，不能靠 9999 解决（Severity: Medium）。
  4) Viewport Units：移动端 100vh 有风险，应使用 dvh 或等价策略（Severity: Medium）。
  5) Container Width：文本不宜满屏，需 max-width 控制（Severity: Medium）。
  6) Z-Index Management：必须建立 z-index scale（10/20/30/50），禁止任意大值（Severity: High）。
  7) Overflow Hidden：滥用 overflow-hidden 会裁剪内容，应优先 overflow-auto 并验证（Severity: Medium）。
  8) Font Loading：字体加载也会导致 layout shift，需 swap + fallback（Severity: Medium）。
- 可执行规则（必须落实到实现/主题 tokens）：
  1) 画布区域尺寸稳定：右侧 3D 画布容器必须设置 `min-height`（推荐 dvh 体系）并预留 loading skeleton 尺寸，避免求解/加载时“跳动”。
  2) 左右分栏：左侧面板独立滚动（overflow-auto），右侧画布固定占位，避免表单高度变化驱动画布重排。
  3) 固定区策略：如底部求解/导出为 sticky/fixed，只允许“一个主固定区”，并定义 token 化高度与间距，避免与顶部导航叠加遮挡。
  4) z-index 体系：在 theme tokens 定义 z-index scale（base/overlay/dropdown/modal/toast），禁止 `z-[9999]`。
  5) CLS 控制：任何图片/截图/占位必须声明 width/height 或 aspect-ratio；字体采用 `font-display: swap` 并指定近似 fallback。
  6) 避免 overflow-hidden 默认化：仅在明确需要的容器使用，3D 画布外层优先允许可见 tooltip/toast。
- 风险点（>=1）：
  - 同时堆叠多个 fixed/sticky（顶部导航 + 底部工具条 + 浮动面板）极易遮挡与不可达，且 z-index/stacking context 问题会放大维护成本。

### 2.2 domain=ux：密集表单输入（分组/标签/反馈/输入类型）
- 关键词/命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dense form input panel grouping accordion" --domain ux -n 8`
- 命中摘要（来自 ux-guidelines.csv）：
  1) Input Labels：每个输入必须有可见 label，禁止只用 placeholder（Severity: High）。
  2) Submit Feedback：提交必须有 loading→success/error 反馈（Severity: High）。
  3) Input Types / Mobile Keyboards：应使用合适 type/inputmode（Severity: Medium）。
  4) Input Affordance：输入控件必须看起来可交互（边框/背景/状态）（Severity: Medium）。
- 可执行规则：
  1) 所有字段必须有可见 label，并与 input 关联（for/id）；placeholder 仅作示例，不作唯一说明。
  2) 求解按钮必须有状态机：Idle/Loading/Success/Error；Loading 禁用并给进度提示；Error 显示原因与重试。
  3) 数值字段统一使用 `inputmode="numeric"`（或 number）并做前置校验（>0、非负、上限），明确单位（mm/kg）。
  4) 表单控件必须具备 hover/focus/error 状态（focus ring 不允许移除），并由 tokens 统一管理。
- 风险点：
  - placeholder-only 输入会导致输入后语义消失且可访问性不达标，直接影响“批量录入”效率与正确性。

### 2.3 domain=typography：字体与可读性（设计系统候选）
- 关键词/命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "design tokens typography scale for app UI" --domain typography -n 8`
- 命中摘要（来自 typography.csv）：
  1) Inter（Minimal Swiss）适用于 dashboard/enterprise apps，功能性强，适合作为单字体系统。
  2) Atkinson Hyperlegible 强可读性，但更偏“无障碍导向”品牌；可作为备选。
- 可执行规则：
  1) MVP 字体系统采用 **Inter** 单字体 + 权重阶梯（400/500/600），减少字体加载风险。
  2) 标题/正文使用一致字号阶梯（H1/H2/body/caption），并在 tokens 中统一定义（禁止组件内硬编码）。
  3) 字体加载使用 `font-display: swap`，并设置接近 metrics 的 fallback，降低 CLS。
- 风险点：
  - 多字体组合会增加加载与 CLS 风险，且对 MVP 无必要；如需品牌化再通过 ADR 决策。

### 2.4 domain=color：功能型中性配色（Design System 候选）
- 关键词/命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "neutral palette functional UI color system" --domain color -n 8`
- 命中摘要（来自 colors.csv）：
  1) 多条结果给出一致的“功能性蓝 + 中性灰背景 + 橙色 CTA”的结构化配色：Primary #3B82F6、CTA #F97316、BG #F8FAFC、Text #1E293B、Border #E2E8F0。
  2) B2B 深色主色方案（#0F172A/#334155）适合偏严肃工具风格。
- 可执行规则：
  1) MVP 采用“中性背景 + 功能蓝 + 高对比 CTA”方案：背景 #F8FAFC、正文 #1E293B、边框 #E2E8F0、主色 #3B82F6、CTA #F97316。
  2) 状态色（success/warn/error/info）必须 token 化；交互态（hover/active/focus）必须由 tokens 推导。
  3) 3D 选中高亮颜色与 UI CTA 不冲突（选中建议使用主色系高亮），并在 tokens 中定义。
- 风险点：
  - 组件内散落硬编码颜色会导致主题不可控、状态不一致，后续维护成本高。

### 2.5 domain=ux：键盘替代拖拽与焦点可见（可访问性覆盖）
- 关键词/命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "keyboard alternative to drag and drop" --domain ux -n 8`
- 命中摘要（来自 ux-guidelines.csv）：
  1) Keyboard Navigation：所有功能必须可键盘访问；Tab 顺序应符合视觉顺序（Severity: High）。
  2) Focus States：必须保留可见焦点指示（Severity: High）。
  3) Skip Links：提供跳转到主内容的链接（Severity: Medium）。
  4) Excessive Motion：动效克制，避免过度动画造成不适（Severity: High）。
- 可执行规则：
  1) 手动摆放必须提供**键盘可达的替代操作**：选中货物后可用按钮/输入框完成移动与旋转（MVP 强制）。
  2) 所有交互控件必须有可见 focus ring；禁止 outline-none 无替代。
  3) 页面提供 “Skip to main content” 跳转链接（尤其当顶部导航/工具条较多时）。
  4) 动画限制：每屏最多 1–2 个关键动效；避免多个持续动画影响编辑专注。
- 风险点：
  - 仅提供拖拽会使键盘用户不可用；同时拖拽失败时无替代路径会导致任务无法完成。

### 2.6 domain=product：3D/编辑器风格取向（作为 UI 方向约束）
- 关键词/命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "3d editor selection highlight focus" --domain product -n 8`
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "webgl three.js performance reduce rerender" --domain product -n 8`
- 命中摘要（来自 products.csv）：
  1) Productivity Tool：Flat Design + Micro-interactions；强调清晰层级与功能性配色。
  2) SaaS：Data-dense + Real-time monitoring；强调信息密度与可读性。
  3) Developer Tool/IDE：暗色极简也可行，但 MVP 先用浅色功能系统，降低复杂度。
- 可执行规则：
  1) 本产品定位为“工具型/生产力”：优先清晰层级、轻微 micro-interactions（hover/active/成功 toast），避免炫技风格。
  2) 信息密度：左侧面板允许 data-dense，但必须分组折叠（accordion/section），并保留全局状态反馈（求解/导出）。
  3) 3D 选中与编辑的反馈必须明确（高亮/描边/属性面板联动），避免“看不出选中了哪个”。
- 风险点：
  - 走“游戏/霓虹/强动效”风格会与 B2B 工具心智冲突，并干扰精确编辑任务。

### 2.7 domain=ux：拖拽/旋转/吸附过程中的反馈（编辑体验）
- 关键词/命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "drag rotate snapping constraints feedback" --domain ux -n 8`
- 命中摘要（来自 ux-guidelines.csv）：
  1) Confirmation/Success Feedback：成功动作必须有确认提示（Severity: Medium）。
  2) Loading States：异步/计算必须有 skeleton 或 spinner，避免冻结（Severity: High）。
  3) Hover/Active States：交互必须有 hover/active 反馈（Severity: Medium）。
  4) Submit Feedback：提交/计算必须反馈（Severity: High）。
- 可执行规则（强制）：
  1) 任何编辑动作（移动/旋转/应用吸附/重置）必须提供即时反馈：active 状态 + 成功 toast（短）。
  2) 求解/导出/校验为异步，必须显示 loading（skeleton/spinner）且禁用重复触发。
  3) Hover/Active 视觉反馈统一由 tokens 定义（按钮、列表项、可点击卡片）。
- 风险点：
  - 交互无反馈会导致用户误判“没生效”，重复操作并引发数据不一致。

### 2.8 stack=react：性能与工程模式（虚拟列表/懒加载/避免无意义 effect）
- 关键词/命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react three.js viewer selection highlight" --stack react -n 8`
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react resizable split pane layout" --stack react -n 8`
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react drag rotate editor interaction patterns" --stack react -n 8`
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react virtualized list selection sync" --stack react -n 8`
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react pointer events drag interaction performance" --stack react -n 8`
- 命中摘要（来自 stacks/react.csv）：
  1) Virtualize long lists：>100 项必须虚拟化（Severity: High）。
  2) Lazy load components：大组件/路由应 lazy（Severity: Medium）。
  3) Avoid unnecessary effects：不要用 useEffect 做派生状态（Severity: High）。
  4) Keys properly：列表必须使用稳定唯一 key（Severity: High）。
  5) Split contexts by concern：避免巨大单一 context（Severity: Medium）。
  6) Container/Presentational split：分离数据逻辑与 UI（Severity: Low）。
  7) Type event handlers：事件类型化（Severity: Medium）。
- 可执行规则（强制）：
  1) 货物清单和装箱结果清单必须虚拟化（react-window 或 react-virtual），并使用稳定 id 做 key，禁止 index。
  2) 3D Viewer 与编辑器组件必须 `React.lazy`，避免首包过大；页面骨架先渲染表单与占位画布。
  3) 禁止用 useEffect 维护派生状态（如过滤/排序），改为 render-time 计算或 memo。
  4) 编辑交互事件必须类型化并使用 React 合成事件；避免在 render 中 bind 造成额外分配。
  5) 状态隔离：主题/权限/编辑状态分别管理（context 分拆或 hooks 分拆），避免单个巨型 context 触发全树重渲染。
  6) 优化以测量为先：使用 React DevTools Profiler 定位瓶颈再优化。
- 风险点：
  - 3D 交互若把高频状态（拖拽位置、每帧渲染）塞进 React 全局 state，会导致明显卡顿，手动摆放不可用。

---

## 3. 目标页面参数化拆解（MVP 目标）

### 3.1 Layout
- 主布局：左右分栏（左：输入/清单；右：3D 画布）
- 左侧面板宽度：默认 380–420px；支持拖拽调整（MVP 可先提供预设宽度按钮：窄/中/宽）
- 右侧画布：占满剩余空间；容器 `min-height: 70dvh`（或等价），避免内容跳动
- 左侧滚动：面板内部滚动；页面整体尽量不滚动（减少画布跳动）

### 3.2 Typography（tokens 权威）
- 字体：Inter（400/500/600）
- 字号阶梯（建议）：
  - H1 20–24
  - H2 16–18
  - Body 14
  - Caption 12
- 字体加载：swap + fallback，避免 layout shift

### 3.3 Color（tokens 权威）
- Background: #F8FAFC
- Text: #1E293B
- Border: #E2E8F0
- Primary: #3B82F6
- CTA: #F97316
- Selection highlight（3D/列表联动）：Primary 系高亮（token 化）

### 3.4 Components Inventory（MVP）
- Header（可选简化）：产品名 + 导入/导出快捷入口
- Left Panel：
  - ContainerForm（集装箱参数）
  - ItemsTable（货物列表，虚拟化）
  - ConstraintsSection（约束）
  - SolveBar（sticky：求解/校验/导出）
- Right Canvas：
  - ViewerToolbar（相机、重置、视图）
  - ThreeViewer（画布）
  - SelectionInspector（选中项属性与手动编辑入口）
- Feedback：
  - Toast（成功/失败）
  - Skeleton/Spinner（求解/加载）

### 3.5 Interactions（MVP）
- 求解：点击 → loading → 成功显示方案 / 失败显示原因
- 选中联动：列表选中 ↔ 3D 高亮一致
- 手动编辑：按钮/输入框（移动/旋转/重置）必须键盘可达；拖拽为增强能力
- 导出：导出前必须 validate；错误时阻止导出并提示问题项

---

## 4. Design Tokens（必须集中定义，禁止魔法值）

### 4.1 Tokens（建议集合）
- colors:
  - bg/default: #F8FAFC
  - text/default: #1E293B
  - border/default: #E2E8F0
  - brand/primary: #3B82F6
  - brand/cta: #F97316
  - state/success, state/warn, state/error, state/info（待定但必须 token 化）
  - selection/highlight（与 primary 协调，待定但必须 token 化）
- typography:
  - font/sans: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"
  - scale: h1/h2/body/caption
- spacing: 4/8/12/16/24/32
- radius: 8/12
- shadow: sm/md
- zIndex scale（必须）：
  - base: 0
  - sticky: 10
  - dropdown: 20
  - overlay: 30
  - modal: 40
  - toast: 50

---

## 5. 组件清单与职责边界

- PackingPage（页面容器）：路由入口、数据加载、布局骨架
- LeftPanel（展示组件）：渲染表单/列表/约束；不直接拼接 API
- SolveController（容器组件）：负责调用 solve/validate/export，管理状态机
- ItemsList（展示组件）：虚拟列表、稳定 key、选中状态
- ThreeViewer（重组件）：React.lazy；渲染与 React 状态隔离，避免全树重渲染
- SelectionInspector：展示选中对象参数 + 手动编辑（键盘可达）

---

## 6. 文案与 i18n（MVP 约束）
- i18n key 前缀：`site.*`
- 双语：zh-cn/en 必须同时存在
- 求解状态文案必须统一（idle/loading/success/error）

---

## 7. 图片/截图占位策略
- 3D 截图导出必须指定输出尺寸（避免导出结果不稳定）
- 任何占位/截图/预览必须提供 width/height 或 aspect-ratio，避免 CLS

---

## 8. Verification（实现后必须逐条打勾）

### 8.1 视觉一致性
- [ ] 画布区域在 loading/成功/失败切换时不跳动（有预留空间/skeleton）
- [ ] z-index 体系生效：toast/弹层不被画布遮挡
- [ ] 左侧面板独立滚动，右侧画布稳定

### 8.2 功能完整性
- [ ] 所有功能可键盘完成（至少：求解、选择条目、手动移动/旋转、导出）
- [ ] focus ring 可见，Tab 顺序合理，无 keyboard trap
- [ ] 求解有 loading/success/error 明确反馈
- [ ] 导出前校验：越界/重叠阻止导出并提示

### 8.3 工程门槛
- [ ] React 重组件已 lazy load
- [ ] 列表已虚拟化（>100 仍流畅）
- [ ] 未使用 index 作为 key
- [ ] 未用 useEffect 维护派生状态（或有充分理由并记录）
