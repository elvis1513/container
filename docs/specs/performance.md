# 性能规格（MVP）

本文件定义 MVP 的性能预算与可验收阈值，用于约束"求解速度、3D 交互流畅度、UI 反馈及时性"。

## 1. 目标

- 20–200 件货物的求解在可接受时间内完成；超时返回 best-effort。
- 3D Viewer 与手动微调过程不因 React 状态更新造成明显掉帧。
- 导出/校验等异步操作始终有可见反馈（避免"无响应"）。

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
- 交互：相机旋转/缩放时页面不得出现明显"整页卡死"
- 更新策略：
  - 相机每帧变化不得写入全局 React state
  - 选中/高亮使用最小状态粒度（id/flags），Three 内部用 ref/imperative 更新

### 3.2 3D 场景性能预算（PR#4B 新增）

#### 3.2.1 渲染性能

- **目标帧率**：相机控制时保持 60 FPS（16.67ms/frame）
- **绘制预算**：单帧 draw calls <= 100（含 Instancing 后）
- **实例化阈值**：货物数量 > 200 时自动启用 InstancedMesh

#### 3.2.2 实例化策略（Instancing）

- **启用条件**：`placements.length > 200`
- **实现方式**：`THREE.InstancedMesh` + `Matrix4` 变换
- **内存预算**：
  - 几何体复用：每种尺寸共享 1 个 Geometry
  - 材质复用：按 itemId hash 分组，最大材质数 <= min(itemCount, 64)
  - 实例矩阵：每个实例 1 个 `Matrix4`（64 bytes）

#### 3.2.3 拾取与高亮性能

- **Raycasting**：
  - 使用 `THREE.Raycaster` 对 `InstancedMesh` 的实例 ID 进行拾取
  - 阈值：`instanceId >= 0` 表示命中
- **高亮更新**：
  - 选中状态变化时只更新实例颜色，不重建场景
  - 使用 `instanceColor` attribute 或材质 uniform 切换
- **Hover 反馈**：
  - 使用节流（throttle 100ms）避免频繁 raycast
  - 可选：显示 Tooltip（DOM overlay，非 canvas 内绘制）

#### 3.2.4 视角切换性能

- **Fit to Container**：
  - 目标：将相机定位到容器边界框的俯视图
  - 过渡：可选平滑插值（300ms），或直接跳转
- **Fit to Selected**：
  - 目标：将相机聚焦到选中物体，保持适当距离
  - 距离计算：`objectSize * 2.5`
- **状态一致性**：视角切换不得触发 React 组件重渲染

#### 3.2.5 内存泄漏防护

- **Geometry/Material 复用**：在 ref 中缓存，按尺寸分组
- **清理策略**：
  - `useEffect` cleanup 必须调用 `geometry.dispose()` / `material.dispose()`
  - `InstancedMesh.dispose()` 必须在组件卸载时调用
- **纹理复用**：无纹理时忽略；有纹理时使用 `TextureLoader` + 缓存 Map

#### 3.2.6 可观测性能指标

- **首屏渲染**：从 solution 到 3D 场景可见 < 100ms
- **交互延迟**：点击到高亮响应 < 50ms
- **视角切换**：Fit to Container/Selected 耗时 < 200ms
- **大场景渲染**：500 boxes 时帧率 >= 30 FPS

### 3.3 列表与表单

- 列表项 > 100 必须虚拟化（react-window/react-virtual）
- 大表单分组/折叠后仍应保持滚动与输入流畅

### 3.4 Profiling 要求（工程约束）

- 任何"手动拖拽/相机控制"场景下，React Profiler 不应显示整棵应用树被频繁 commit
- 若出现 commit 频繁，必须拆分状态域（viewer 内部 state / refs / 局部 store）

## 4. 异步反馈

- 求解：loading 必须在 100ms 内出现（按钮进入 loading/disabled）
- 导出：导出过程必须显示进度/loading；失败必须显示错误原因
- 校验：校验失败必须可定位到具体货物（列表跳转/高亮）

## 5. 性能验收方法（手工验证）

### 5.1 Chrome DevTools Performance

1. 打开 `Performance` 标签
2. 录制 5 秒相机旋转操作
3. 查看 FPS：应 >= 55 FPS
4. 查看 Main 线程：无明显长任务（>50ms）

### 5.2 React Profiler

1. 安装 React DevTools Profiler
2. 录制相机控制 + 选中操作
3. 确认：未因相机移动触发组件 commit

### 5.3 内存验证

1. Chrome DevTools Memory -> Heap Snapshot
2. 操作：加载方案 -> 切换选中 -> 导出截图 -> 清空
3. 确认：无明显 DOM/Geometry/Material 泄漏

### 5.4 大场景压测

- 测试数据：生成 500 个小货物
- 验收标准：
  - 首屏加载 < 500ms
  - 相机控制 >= 30 FPS
  - 点击选中响应 < 100ms
