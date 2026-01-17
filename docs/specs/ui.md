# UI 规格（MVP）：装箱优化器

## 0. 约束与引用
- UI 细节与验收清单以 `docs/ui-lockfiles/*.md` 为准。
- 求解目标、硬约束、超时语义以 `docs/specs/packing-algorithm.md` 为准。
- 性能预算与工程护栏以 `docs/specs/performance.md` 为准。

## 1. 页面信息架构（MVP：单页闭环）
- `/packing`：装箱优化器主页面（输入 → 求解 → 3D → 微调 → 导出）

## 2. 布局（建议）
- 左侧：输入面板（货物、容器、约束、求解按钮、指标）
- 右侧：3D 视图（旋转/缩放/平移、选中高亮、网格/坐标轴开关）
- 底部或右下：货物清单/搜索定位 + 导出区

## 3. 关键交互（必须）
- 清单点击某货物：3D 高亮并聚焦
- 3D 点击某货物：清单同步选中并滚动到可见
- 手动拖拽：实时显示坐标；释放后触发校验（本地或后端）
- 旋转：提供 90° 旋转按钮（X/Y/Z 或按 orientation 切换）
- 校验错误：以非阻塞提示 + 明确错误列表呈现；错误状态下导出需标注 invalid 或禁用

补充（MVP 交互要求）：
- 求解必须有 loading，且给出 `status`（OK / TIMEOUT_BEST_EFFORT）与耗时
- 手动编辑必须提供键盘替代路径（见 lockfile）

## 4. 导出
- 导出按钮提供：JSON、CSV/XLSX、PNG（或一键 ZIP）
- 导出前必须保证：校验通过，或用户明确确认导出为 invalid（MVP 可直接禁用导出）

导出产物建议：
- `plan.json`：容器、货物、placements、score、meta（包含 solverVersion/seed/options）
- `items.csv`：便于二次分析/打印
- `view.png`：前端 Viewer 截图（后端导出接口可接收 `viewPngBase64`）

## 5. i18n
- 所有文案 key 使用 `site.*` 前缀（即便是应用页，也采用一致前缀，避免混乱）
- `zh-cn` 与 `en` 同步补齐

## 6. UI Lockfile 要求
- 每新增一个可感知 UI 模块（例如：3D 视图、输入面板、导出对话框），必须建立对应 Lockfile：
  - `docs/ui-lockfiles/packing-page.md`
  - `docs/ui-lockfiles/three-viewer.md`
  - `docs/ui-lockfiles/manual-editing.md`
