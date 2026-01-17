# UI Lockfile: /packing（装箱优化器主页面）

## 1. Feature / Page
- Name: Packing Optimizer Page
- Scope boundary: 单页闭环（输入→求解→3D→微调→导出），不包含物流、账号、历史方案等扩展模块。

## 2. UI/UX Pro Max Skills 检索记录
- domain 搜索：
  - 关键词/命令：TBD
  - 命中摘要：TBD
  - 可执行规则（>=3）：TBD
  - 反模式/风险点（>=1）：TBD
- stack=react 搜索：
  - 关键词/命令：TBD
  - 命中摘要：TBD
  - 可执行规则（>=3）：TBD
  - 反模式/风险点（>=1）：TBD

## 3. 参数化拆解（layout/typography/color/components/interactions）
- layout: 左输入右 3D，单页完成任务，减少跳转。
- typography: TBD（由 tokens 定义）
- color: TBD（由 tokens 定义）
- components: InputPanel、ConstraintPanel、SolveButton、MetricsBar、ItemList、ExportPanel、ThreeViewer
- interactions: 清单<->3D 双向联动；拖拽/旋转；错误提示与导出状态联动。

## 4. Design Tokens
- colors: TBD
- typography: TBD
- spacing: TBD
- radius: TBD
- shadow: TBD
- z-index: TBD
- breakpoints: TBD

## 5. 组件清单与职责
- layout: SiteShell（若复用）、PackingLayout
- components: ThreeViewer（独立）、ItemList、ExportDialog

## 6. 文案与 i18n
- key 前缀：site.*
- zh-cn/en coverage: 必须双语齐全

## 7. 图片/资源策略
- ratio: 3D 截图按固定比例输出
- width/height: 必须声明，避免 CLS
- lazy-load: 非首屏资源懒加载

## 8. Verification
- [ ] layout/tokens 一致
- [ ] 清单与 3D 双向联动可用
- [ ] 拖拽/旋转可用且可校验
- [ ] 导出产物齐全（json/csv|xlsx/png）
- [ ] lint/prettier/test 通过或记录
