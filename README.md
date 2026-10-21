# 工会综合数据看板

基于 **Vue 3 + TypeScript + Vite + ECharts** 的工会综合数据看板，集中展示思想引领、就业概况、阅读用户地区分布、工会活动、用户类型、劳模工匠、工会组织与积分发放等业务数据。

> ⚠️ 当前所有业务数据均为**模拟数据（mock）**，仅用于页面演示与交互验证，不代表真实工会业务统计结果。

## 功能清单

| 模块 | 图表 / 形式 | 说明 |
| --- | --- | --- |
| 思想引领 | 4 张统计卡片 | 文章发布数、阅读量、文章采纳数、点赞量 |
| 就业概况 | 4 张统计卡片 | 发布岗位、求职人数、促进就业、招聘活动 |
| 阅读用户地区分布 | ECharts 横向柱状图 | `xAxis.type = 'value'` + `yAxis.type = 'category'`，柱体末端显示「数值 + 人」 |
| 工会活动 | 原生 HTML 表格 | 排名 / 活动名称 / 分类 / 参与人次，表头 `sticky`，行高统一 |
| 用户类型 | ECharts 环形饼图 | `radius` 内外半径 + `padAngle` 扇区间隔，中心展示由数据求和得到的总用户数 |
| 劳模工匠 | ECharts 极坐标柱状图 | `polar` / `angleAxis` / `radiusAxis` 四级配色，图例颜色与柱体一一对应 |
| 工会组织 | ECharts 玫瑰图 | `roseType = 'radius'`，半径体现数值差异 |
| 积分发放 | ECharts 竖向柱状图 | 柱体末端数值标签、纵轴单位「积分」，支持「类型视图 / 月度视图」切换（选做功能已实现） |

其他工程要点：

- 组件化拆分：页面（`views`）、卡片/统计（`dashboard`）、图表（`charts`）、数据（`data`）、类型（`types`）、工具（`utils`）分离。
- `BaseEChart` 统一封装 ECharts 生命周期：挂载后初始化、配置变化 `setOption`（`notMerge`）、`ResizeObserver` + window `resize` 自适应、卸载时 `dispose` 并清理监听；容器尺寸为 0 时延后初始化。
- ECharts 按需注册（`BarChart` / `PieChart` / `Grid` / `Polar` / `Tooltip` / `Legend` / `AxisPointer` / `CanvasRenderer`）。
- 所有合计值（合计人数、占比、总计）均由明细数据计算，不在模板中硬编码。
- 响应式：桌面 3 列 → 中等屏 2 列 → 窄屏单列，图表随容器尺寸自动 resize，无横向溢出。

## 目录结构

```text
.
├── docs/                       # 需求文档（plan.md / agents.md）
├── public/
│   └── favicon.svg
├── scripts/
│   └── ui-check.mjs            # 无头浏览器页面验收脚本（CDP）
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── BaseEChart.vue  # ECharts 公共封装（初始化/更新/resize/销毁）
│   │   │   └── echarts.ts      # 按需注册 ECharts 模块与类型导出
│   │   └── dashboard/
│   │       ├── ActivityTable.vue        # 工会活动表格
│   │       ├── ChartCard.vue            # 图表卡片外壳（标题/副标题/操作区）
│   │       ├── ChartLegend.vue          # 自定义图例（颜色与图形共用色板）
│   │       ├── DashboardHeader.vue      # 页面标题与统计口径
│   │       ├── MasterPolarChart.vue     # 劳模工匠极坐标柱状图
│   │       ├── PointsBarChart.vue        # 积分发放竖向柱状图
│   │       ├── RegionBarChart.vue       # 地区分布横向柱状图
│   │       ├── StatGroup.vue            # 统计卡片组
│   │       ├── UnionRoseChart.vue       # 工会组织玫瑰图
│   │       └── UserTypeDonutChart.vue   # 用户类型环形饼图
│   ├── data/
│   │   ├── dashboard.ts        # 模拟数据（按后端接口形状组织）
│   │   └── palette.ts          # 统一色板与图表视觉常量
│   ├── styles/
│   │   └── dashboard.css       # 设计变量、页面骨架、栅格、分段控件
│   ├── types/
│   │   ├── chart.ts            # 图例项类型
│   │   └── dashboard.ts        # 看板数据接口类型定义
│   ├── utils/
│   │   └── format.ts           # 千分位、占比、求和
│   ├── views/
│   │   └── DashboardView.vue   # 页面布局与模块编排
│   ├── App.vue
│   ├── main.ts
│   └── vite-env.d.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 主要依赖

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| vue | ^3.5.13 | 视图框架（Composition API + `<script setup lang="ts">`） |
| echarts | ^5.5.1（实际安装 5.6.0） | 全部图表（`padAngle` 需 5.5+） |
| vite | ^5.4.11 | 开发服务器与构建 |
| typescript | ~5.6.3 | 类型系统 |
| vue-tsc | ^2.1.10 | 单文件组件类型检查 |
| @vitejs/plugin-vue | ^5.2.1 | Vite 的 Vue 支持 |

安装命令：

```bash
npm install
```

## 本地运行

```bash
npm run dev        # 开发服务器，默认 http://127.0.0.1:5173/
npm run build      # 类型检查 + 生产构建（输出 dist/）
npm run preview    # 预览生产构建，默认 http://127.0.0.1:4173/
npm run type-check # 仅执行 TypeScript / Vue 类型检查
```

## 页面验收脚本

`scripts/ui-check.mjs` 通过 Chrome DevTools Protocol 驱动无头 Chrome / Edge，检查控制台错误、模块与画布渲染、积分发放视图切换、多尺寸横向溢出，并把截图输出到 `.tmp/`。

```bash
npm run dev                    # 先在另一个终端启动服务
npm run check:ui               # 默认检查 http://127.0.0.1:5173/
node scripts/ui-check.mjs --url=http://127.0.0.1:4173/
```

要求：Node 22+（内置 `fetch` 与 `WebSocket`）、本机安装 Chrome 或 Edge（可用 `CHROME_PATH` 指定路径）。

## 接入真实数据

1. 将 `src/data/dashboard.ts` 的 `dashboardMockData` 替换为接口返回，字段形状参考 `src/types/dashboard.ts`。
2. 组件只需接收数据 props（如 `:data="regionReads"`），无需改动图表配置逻辑。
3. 合计、占比等派生值由组件用 `src/utils/format.ts` 计算，接口只需返回明细数据。

## 已知说明

- 数据为模拟数据，页面顶部与底部均有「模拟数据」标识；月度视图同样为模拟数据。
- 类型视图与月度视图的合计值一致（均为 58,180 积分），用于演示同一口径下的不同聚合视角。
- 积分发放月度视图在类目较多时自动旋转横轴文字并收窄数值标签，属于响应式处理。
