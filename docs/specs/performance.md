# 性能规格（MVP）

本文件定义 MVP 的性能预算与可验收阈值，用于约束“求解速度、3D 交互流畅度、UI 反馈及时性”。

## 1. 目标
- 20–200 件货物的求解在可接受时间内完成；超时返回 best-effort。
- 3D Viewer 与手动微调过程不因 React 状态更新造成明显掉帧。
- 导出/校验等异步操作始终有可见反馈（避免“无响应”）。

## 2. 后端求解性能
### 2.1 默认参数
- `maxDurationMs`: 2000
- `maxIterations`: 5000（若算法实现使用迭代上限）
- `deterministic`: true（同输入同 seed 同版本可复现）

### 2.2 验收阈值（服务端）
- P95 响应时间：`<= maxDurationMs + 200ms`（包括 best-effort 返回）
- 典型输入：
  - Case-20：20 件（同规格/少约束）应在 `<= 300ms` 内返回
  - Case-200：200 件（混装/多约束）应在 `<= 2200ms` 内返回（允许 best-effort）

> 说明：阈值以单机开发机/测试环境为准；若后续引入并行求解或缓存，可再收紧。

## 3. 前端渲染与交互性能
### 3.1 3D Viewer
- 初始化：Viewer 必须 `React.lazy`，首屏先渲染布局骨架（避免 CLS）
- 交互：相机旋转/缩放时页面不得出现明显“整页卡死”
- 更新策略：
  - 相机每帧变化不得写入全局 React state
  - 选中/高亮使用最小状态粒度（id/flags），Three 内部用 ref/imperative 更新

### 3.2 列表与表单
- 列表项 > 100 必须虚拟化（react-window/react-virtual）
- 大表单分组/折叠后仍应保持滚动与输入流畅

### 3.3 Profiling 要求（工程约束）
- 任何“手动拖拽/相机控制”场景下，React Profiler 不应显示整棵应用树被频繁 commit
- 若出现 commit 频繁，必须拆分状态域（viewer 内部 state / refs / 局部 store）

## 4. 异步反馈
- 求解：loading 必须在 100ms 内出现（按钮进入 loading/disabled）
- 导出：导出过程必须显示进度/loading；失败必须显示错误原因
- 校验：校验失败必须可定位到具体货物（列表跳转/高亮）

