# UI Lockfile: Three Viewer（3D 结果展示）

> 范围：Three.js/WebGL 视图，用于展示装箱结果与选中高亮，并为手动摆放提供可视反馈。  
> 目标：稳定、可选中、不卡顿、可导出截图。

---

## 1. 范围与边界

### 1.1 必须
- 3D 场景：集装箱（半透明或线框）+ 货物箱体
- 相机控制：旋转/平移/缩放、重置视角
- 选中高亮：点击 3D 货物 → 高亮并同步左侧列表
- 截图导出：导出 PNG（指定尺寸）
- 性能约束：不因 React 频繁状态更新导致掉帧

### 1.2 可选（后续迭代）
- 框选、多选
- 视图预设（顶视/侧视/透视）
- 性能统计面板（FPS）

---

## 2. Skills 检索记录（摘取 packing-page 已覆盖的关键证据）

### 2.1 domain=ux（布局稳定/CLS/z-index）
- 参考：`docs/ui-lockfiles/packing-page.md` 2.1（Content Jumping / Z-Index / Overflow / Font loading）

可执行规则（viewer 侧落实）：
1) Viewer 容器固定占位（min-height + skeleton），避免模型加载造成 layout shift。
2) Tooltip/toast 不得被 canvas 裁剪或遮挡（避免错误 overflow-hidden；使用 zIndex tokens）。
3) 截图/缩略图输出固定尺寸，避免不稳定的导出结果。

### 2.2 stack=react（性能/懒加载/避免无意义 effect）
- 参考：`docs/ui-lockfiles/packing-page.md` 2.8（Virtualize、Lazy、Avoid unnecessary effects、Profiler）

可执行规则（viewer 侧落实）：
1) ThreeViewer 必须 React.lazy；首屏先渲染布局骨架。
2) 高帧率交互状态（拖拽/相机）不得通过全局 React state 逐帧更新；采用 viewer 内部状态或 refs。
3) 任何派生计算（例如过滤可见物体）避免用 useEffect 做 setState 链路。

---

## 3. 参数化约束

### 3.1 Canvas 容器
- min-height: 70dvh（或等价）
- resize：随窗口变化自适应，但不得触发布局跳动
- background：使用 theme bg token（避免“纯黑游戏感”）

### 3.2 选中高亮
- 选中颜色：selection/highlight token
- 未选中：中性材质（与 UI 主色不冲突）
- 选中状态必须可撤销（点击空白/ESC）

---

## 4. 组件职责建议（实现参考）
- `ThreeViewer`：场景构建、渲染循环、相机控制、拾取（raycast）、高亮
- `ViewerToolbar`：按钮（重置视角/截图/显示网格）
- `useViewerSelection`：与外部（列表）同步选中 id

---

## 5. Verification
- [ ] Loading/Success 切换无 layout shift
- [ ] 选中高亮与列表联动正确
- [ ] Toast/弹层不被 canvas 遮挡
- [ ] 截图输出尺寸稳定且内容正确
- [ ] 重组件 lazy load 生效，首屏不卡
