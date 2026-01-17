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

### 2.1 domain=ux：键盘可达与焦点可见（替代拖拽）
- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "keyboard alternative to drag and drop" --domain ux -n 8`
- 命中要点：
  - Keyboard Navigation：功能必须键盘可达（High）
  - Focus States：必须可见 focus ring（High）
  - Skip Links：提供跳过导航（Medium）
  - Excessive Motion：动效克制（High）
- 可执行规则：
  1) 手动摆放必须提供键盘可达路径：按钮/输入框可完成移动与旋转；不得仅靠拖拽。
  2) focus ring 不能移除；Tab 顺序必须与视觉顺序一致。
  3) 动效克制：编辑动作只提供轻微反馈（active/短 toast），避免持续动画干扰精确操作。
- 风险点：
  - 只有拖拽没有替代操作会导致功能不可用（键盘用户/触控不精确/拖拽失败场景）。

### 2.2 domain=ux：编辑过程反馈（loading/success/hover/active）
- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "drag rotate snapping constraints feedback" --domain ux -n 8`
- 命中要点：
  - Success/Confirmation Feedback（Medium）
  - Loading States（High）
  - Hover/Active States（Medium）
  - Submit Feedback（High）
- 可执行规则：
  1) 每次应用编辑（移动/旋转/重置）必须有 active 状态与成功 toast。
  2) 校验/导出为异步必须有 loading，避免“无响应”。
  3) 可点击项必须有 hover/active 视觉反馈（token 化）。
- 风险点：
  - 无反馈会导致重复操作与误判，最终造成数据不一致或导出错误。

### 2.3 stack=react：事件/性能（避免无意义 effect、类型化事件）
- 命令：
  - `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react pointer events drag interaction performance" --stack react -n 8`
- 命中要点：
  - Avoid unnecessary effects（High）
  - Type event handlers（Medium）
  - Profiler（Medium）
- 可执行规则：
  1) 编辑参数（位置/旋转）派生显示不要用 useEffect 写回 state；用 memo 或 render-time 计算。
  2) 事件处理必须类型化且使用合成事件；避免在 render 里 bind。
  3) 优化前用 Profiler 定位热点。

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
- [ ] 不依赖拖拽也可完成移动/旋转/重置
- [ ] focus ring 可见，Tab 顺序合理
- [ ] 编辑成功有 toast，失败有错误提示
- [ ] 越界/重叠会阻止导出并可定位问题项
