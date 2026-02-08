# UI Lockfile: Manual Editing（手动摆放）

> 范围：用户在求解结果基础上，手动调整货物位置/旋转，并得到即时校验与反馈。  
> MVP 原则：先保证“可完成任务”（键盘可达的按钮/输入框）再补强“直接拖拽”。

---

## 1. 范围与边界

### 1.1 必须（MVP）

- 选中货物后可编辑：
  - 平移：X/Y/Z（步进按钮 + 数值输入）
  - 旋转：绕轴旋转（90°/180°快捷 + 数值输入可选）
  - 重置：回到求解位置
- 校验：
  - 越界（超出集装箱）提示并阻止导出
  - 重叠（与其他货物碰撞）提示并阻止导出
- 反馈：
  - 操作成功 toast
  - 校验失败 error 状态展示（列表定位到问题项）

### 1.2 可选（后续）

- 拖拽（pointer drag）
- 吸附（snap to grid / snap to wall / snap to items）
- 撤销/重做（undo/redo）

---

## 2. Skills 检索证据（来自执行结果）

### 2.1 domain=ux：键盘替代拖拽与焦点可见

- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "keyboard alternative to drag and drop" --domain ux --json --max-results 8`
- 命中要点：
  - Keyboard Navigation：所有功能可键盘访问，Tab 顺序与视觉一致（High）
  - Focus States：必须有可见 focus ring（High）
  - Skip Links：提供跳转到主要内容（Medium）
  - Excessive Motion：动效克制，避免干扰精确编辑（High）
  - Mobile Keyboards：数值输入需合适 inputmode（Medium）
- 可执行规则：
  1. 手动摆放必须提供键盘可达路径：按钮/输入框可完成移动与旋转；不得仅靠拖拽。
  2. focus ring 不得移除；Tab 顺序与视觉顺序一致，避免键盘陷阱。
  3. 数值输入统一 `inputmode="numeric"` 并保留单位提示（mm/kg）。
- 风险点：
  - 仅拖拽无替代路径会导致功能不可用（键盘用户/拖拽失败场景）。

### 2.2 domain=ux：表单校验与错误反馈

- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "inline validation error summary form" --domain ux --json --max-results 8`
- 命中要点：
  - Inline Validation：建议 onBlur 触发校验（Medium）
  - Error Messages：错误需可被读屏器宣布（High）
  - Submit Feedback：提交必须有 loading → success/error（High）
  - Form Labels：禁止 placeholder-only，必须有 label（High）
  - Error Placement：错误靠近字段显示（Medium）
- 可执行规则：
  1. 位置/旋转输入在 blur 后立即校验并提示（字段下方错误提示）。
  2. 错误提示使用 `role="alert"` 或 `aria-live`，确保可访问。
  3. 校验失败阻止导出，并给出“如何修复”的明确提示。
- 风险点：
  - 仅全局错误或无修复指引会导致重复错误与误导导出。

### 2.3 domain=typography：密集参数面板的可读性

- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "typography scale for dense data entry panels" --domain typography --json --max-results 8`
- 命中要点：
  - Inter（Minimal Swiss）：适合功能型仪表盘/工具（Notes）
  - Fira Sans/Code：适合数据密集与数值对齐（Notes）
  - 单字体系统更易维护与减少 CLS（Notes）
- 可执行规则：
  1. 保持现有 Inter 字体体系，数值输入与标签使用统一字号阶梯。
  2. 信息层级：标题 > 分组标题 > 标签 > 辅助说明，全部来自 tokens。
  3. 文案长度受控，避免长标签导致表单换行与跳动。
- 风险点：
  - 字体体系混用或字号不一致会降低可读性与输入准确率。

### 2.4 domain=color：状态色与校验提示

- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "status colors for validation errors success warnings" --domain color --json --max-results 8`
- 命中要点：
  - 功能型配色：Primary #3B82F6 + Neutral 背景 + 细边框（多条一致）
  - CTA 强对比（#F97316）适合关键操作
  - 中性灰背景 + 高对比文本用于数据密集面板
- 可执行规则：
  1. 校验状态使用 token 化状态色（success/warn/error），禁止硬编码。
  2. 选中/高亮与错误色区分，避免混淆“选中 vs 错误”。
  3. 错误与警告背景用浅色底提升可见性（token 化）。
- 风险点：
  - 错误色与选中色混用会造成误判，影响修复效率。

### 2.5 domain=product：编辑器/Inspector 风格方向

- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "inspector panel for editing parameters professional tool" --domain product --json --max-results 8`
- 命中要点：
  - Productivity Tool：功能清晰 + 轻微 micro-interactions
  - Analytics/Dashboard：数据密度高但需清晰层级
  - Developer Tool（暗色/极简）可选但非 MVP 重点
- 可执行规则：
  1. 编辑面板走“工具型清晰层级”路线，避免过强装饰。
  2. 反馈使用轻量 toast/状态条，避免干扰主编辑流程。
  3. 控件密度高但分组明确（平移/旋转/重置/校验分区）。
- 风险点：
  - 过度动效或游戏化风格会干扰精确编辑任务。

### 2.6 stack=react：可访问性与状态结构

- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react keyboard shortcuts accessibility focus management" --stack react --json --max-results 8`
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react derived state avoid useEffect" --stack react --json --max-results 8`
- 命中要点：
  - Manage focus properly / Use semantic HTML（High）
  - Label form controls（High）
  - Virtualize long lists >100（High）
  - Avoid unnecessary effects / Avoid unnecessary state（High）
  - Type event handlers（Medium）
- 可执行规则：
  1. 编辑控件必须使用语义化 button/input，并完整 label/aria 关联。
  2. 派生数据（校验结果/可导出状态）用 memo/计算，不用 useEffect 回写。
  3. 事件处理类型化，避免在 render 内创建大量新函数。
- 风险点：
  - 把派生值写入 state 或滥用 useEffect 会引发重复渲染与卡顿。

---

## 3. 交互规格（MVP 明确）

### 3.1 编辑面板（SelectionInspector）

- 必须提供：
  - X/Y/Z：`-`、`+` 步进按钮（默认步进 1mm/10mm 可切换）+ 数值输入
  - Rotate：绕轴 90° 快捷按钮（X/Y/Z）+ Reset
  - 校验状态：OK / Out of bounds / Colliding（带图标与文案）
- 键盘：
  - Tab 到步进按钮与输入框
  - Enter 应用输入框修改
  - ESC 清除选中（可选但建议）

### 3.2 校验与导出联动

- 导出前强制 validate：
  - 若存在越界/重叠，导出按钮禁用并给出可定位错误列表
  - 点击错误项可在列表与 3D 中定位/高亮

---

## 4. Verification

- [x] 不依赖拖拽也可完成移动/旋转/重置
- [x] focus ring 可见，Tab 顺序合理
- [x] 编辑成功有 toast，失败有错误提示
- [x] 越界/重叠会阻止导出并可定位问题项
