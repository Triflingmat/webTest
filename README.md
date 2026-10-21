# 工会综合数据看板

基于 **Vue 3 + TypeScript + Vite + ECharts** 的工会综合数据看板，集中展示思想引领、就业概况、阅读用户地区分布、工会活动、用户类型、劳模工匠、工会组织与积分发放等业务数据。

> ⚠️ 当前所有业务数据均为**模拟数据（mock）**，仅用于页面演示与交互验证，不代表真实工会业务统计结果。

## 功能清单

| 模块 | 图表 / 形式 | 说明 |
| --- | --- | --- |
| 思想引领 | 4 张统计卡片 | 文章发布数、阅读量、文章采纳数、点赞量，支持 Flex / Grid 双布局 |
| 就业概况 | 4 张统计卡片 | 发布岗位、求职人数、促进就业、招聘活动，与思想引领共用布局切换和数字入场动画 |
| 阅读用户地区分布 | ECharts 横向柱状图 | 5 条地区数据降序排列，窗口固定 3 条，每 3 秒向上循环滚动一条，边缘渐隐 |
| 工会活动 | 原生 HTML 表格 | 7 条活动数据，固定表头、4 行可视，每 3 秒向上滚动一行并无缝循环 |
| 用户类型 | ECharts 环形饼图 | 渐变扇区 + `padAngle` 间隔，中心展示求和得到的用户总数 |
| 劳模工匠 | ECharts 极坐标圆角柱状图 | 4 级圆头柱，`radiusAxis` 承载级别、`angleAxis` 承载人数，3 秒圆弧入场 |
| 工会组织 | ECharts 玫瑰图 | `roseType = 'radius'`，半径体现数量差异，扇区内嵌编号 6 图片素材 |
| 积分发放 | ECharts 竖向柱状图 | 类型视图；月度视图覆盖 1—12 月，固定 6 个月并以 3 秒水平循环滚动 |

## 扩展功能 A1—A7

| 项 | 实现方式 | 验收要点 |
| --- | --- | --- |
| A1 | `StatGroup` 增加 `layout: 'flex' / 'grid'`，同一组件、同一数据源维护两套布局样式 | 页面右上角「统计卡片布局」可切换；数字动画不因切换重置；图标/名称/目标值一致 |
| A2 | ECharts 绘制 8 行重复视觉轨道，3 行视口用 CSS `translateY` 滚动；滚动仅移动容器，不重绘柱体 | 窗口按 ABC→BCD→CDE→DEA→EAB→ABC 循环；上下边缘渐隐；文字与柱体在同一画布内同步移动 |
| A3 | 固定表头 + 独立滚动视口；7 条真实数据追加 4 条克隆行，滚动到底后无感复位 | 4 行可视、每次上移 1 行、表头固定、表尾按 7 条数据统计 |
| A4 | `USER_TYPE_GRADIENTS` 统一维护渐变；ECharts 线性渐变 + 渐变图例圆点；`animationType: 'expansion'` | 5 个类别颜色可区分；图例与扇区渐变同源；可观察到 3 秒展开 |
| A5 | 极坐标系列使用统一 `CHART_ANIMATION`，圆弧从起始角连续增长 | 4 个级别、颜色映射不变，3 秒内连续增长至数据目标值 |
| A6 | `UNION_ORG_IMAGES` 映射编号 6 素材，预加载成功后挂载图表；类别标签使用图片背景 | 4 张素材均加载；图片位于对应扇区内部；单张加载失败时仅隐藏该图片，图表仍可用 |
| A7 | 18 个槽位（12 个月 + 前 6 个月克隆）放在 300% 宽轨道，视口固定 6 个月；仅平移容器 | 1—6 月起步，推进到 7—12 月后进入 8 月—1 月；画布像素不因滚动重绘 |

统一动画配置维护在 `src/config/animation.ts`：

- 入场时长、单次过渡时长：`3000ms`
- 轮播间隔：`3000ms`
- 首次轮播延迟：`3000ms`（先完成入场）
- 动画开关：`ANIMATIONS_ENABLED`

## 其他工程要点

- 组件化拆分：页面（`views`）、卡片/统计（`dashboard`）、图表（`charts`）、数据（`data`）、类型（`types`）、工具（`utils`）分离。
- `BaseEChart` 统一封装 ECharts 生命周期：挂载后初始化、配置变化 `setOption`（`notMerge`）、`ResizeObserver` + window `resize` 自适应、卸载时 `dispose` 并清理监听；容器尺寸为 0 时延后初始化。
- `ResizeObserver` 首次回调会与初始化尺寸比较，尺寸未变化时跳过 `resize()`，避免打断 3 秒入场动画；窗口实际变化时才 resize。
- `useCarousel` 统一管理轮播定时器：首次延迟、3 秒间隔、重复启动保护、组件卸载清理。
- `AnimatedNumber` 使用 `requestAnimationFrame` 从 0 连续增长到目标值，切换布局不会重新触发。
- ECharts 按需注册（`BarChart` / `PieChart` / `Grid` / `Polar` / `Tooltip` / `Legend` / `AxisPointer` / `CanvasRenderer`）。
- 思想引领 / 就业概况的 8 张统计卡片通过 `StatCardItem.icon` 渲染 `public/assets/1` 下的业务图标，图标与指标一一对应。
- 工会组织使用 `public/assets/6`：康居乡村→村社工会、其他→其他、企业→企业、企事业单位→事业单位。
- 所有合计值（合计人数、占比、总计）均由明细数据计算，不在模板中硬编码。
- 响应式：桌面 3 列 → 中等屏 2 列 → 窄屏单列，图表随容器尺寸自动 resize，无横向溢出。

## 目录结构

```text
.
├── docs/                       # 需求文档（plan.md / agents.md）
├── public/
│   ├── assets/
│   │   ├── 1/                  # 思想引领 / 就业概况统计图标
│   │   └── 6/                  # 工会组织玫瑰图素材
│   └── favicon.svg
├── scripts/
│   ├── ui-check.mjs            # 页面基础验收（CDP）
│   └── feature-check.mjs       # A1—A7 浏览器验收（CDP）
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── BaseEChart.vue  # ECharts 公共封装（初始化/更新/resize/销毁）
│   │   │   └── echarts.ts      # 按需注册 ECharts 模块与类型导出
│   │   └── dashboard/
│   │       ├── ActivityTable.vue        # 活动表格滚动
│   │       ├── AnimatedNumber.vue       # 数字增长动画
│   │       ├── ChartCard.vue            # 图表卡片外壳
│   │       ├── ChartLegend.vue          # 自定义图例（支持纯色/渐变）
│   │       ├── 控制台Header.vue      # 页面标题与统计口径
│   │       ├── MasterPolarChart.vue     # 劳模工匠极坐标圆角柱状图
│   │       ├── PointsBarChart.vue       # 积分发放类型/月度滚动
│   │       ├── 区域BarChart.vue       # 地区分布滚动柱状图
│   │       ├── StatGroup.vue            # 统计卡片组（Flex / Grid）
│   │       ├── UnionRoseChart.vue       # 工会组织玫瑰图 + 内嵌图片
│   │       └── UserTypeDonutChart.vue   # 用户类型渐变环形图
│   ├── composables/
│   │   └── useCarousel.ts      # 统一轮播定时器
│   ├── config/
│   │   └── animation.ts        # 全站动画/轮播常量
│   ├── data/
│   │   ├── dashboard.ts        # 模拟数据
│   │   └── palette.ts          # 色板、渐变、组织图片映射
│   ├── styles/
│   │   └── dashboard.css       # 设计变量、页面骨架、栅格、分段控件
│   ├── types/
│   │   ├── chart.ts            # 图例项类型
│   │   └── dashboard.ts        # 看板数据接口类型定义
│   ├── utils/
│   │   └── format.ts           # 千分位、占比、求和
│   ├── views/
│   │   └── 控制台查看.vue   # 页面布局与模块编排
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
| echarts | ^5.5.1（实际安装 5.6.0） | 全部图表（`roundCap` / `padAngle` 均由当前版本支持） |
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

## 浏览器验收

两个脚本都通过 Chrome DevTools Protocol 驱动无头 Chrome / Edge。需要先在另一个终端启动开发服务器。

```bash
npm run dev
npm run check:ui        # 基础页面/切换/多尺寸回归
npm run check:features  # A1—A7 逐项动画与滚动验收
```

也可以指定地址：

```bash
node scripts/ui-check.mjs --url=http://127.0.0.1:4173/
node scripts/feature-check.mjs --url=http://127.0.0.1:4173/
```

`feature-check.mjs` 会实际读取页面状态、导出截图到 `.tmp/`，并检查：

- A1 双布局计算样式、数据一致性、数字动画不重置；
- A2 5 条数据、3 条窗口、6 次连续推进、边缘渐隐与 3 秒过渡；
- A3 7 条数据、4 行视口、固定表头、循环复位；
- A4 5 个渐变图例与扇区画面变化；
- A5 极坐标画面变化；
- A6 编号 6 的 4 张图片加载；
- A7 12 个月数据、6 个月窗口、8—1 月跨年窗口、平移不重绘、视图切换定时器清理；
- 760px / 600px 响应式与画布 resize。

要求：Node 22+（内置 `fetch` 与 `WebSocket`）、本机安装 Chrome 或 Edge（可用 `CHROME_PATH` 指定路径）。

## 接入真实数据

1. 将 `src/data/dashboard.ts` 的 `dashboardMockData` 替换为接口返回，字段形状参考 `src/types/dashboard.ts`。
2. 组件只需接收数据 props（如 `:data="regionReads"`），无需改动图表配置逻辑。
3. 合计、占比等派生值由组件用 `src/utils/format.ts` 计算，接口只需返回明细数据。
4. A2 的滚动窗口依赖初始化时的降序排序；接入接口后仍由组件内部稳定排序后再滚动。

## 已知说明

- 数据为模拟数据，页面顶部与底部均有「模拟数据」标识；月度视图同样为模拟数据。
- 类型视图与月度视图的合计值一致（均为 58,180 积分），用于演示同一口径下的不同聚合视角。
- 月度视图首次进入时重新播放入场并延迟 3 秒开始滚动；切回类型视图会清理月度定时器。
- 工会组织素材为白色图标，放在彩色扇区上显示；素材加载失败时仅隐藏该类别图片，玫瑰图和图例仍可正常使用。
- 地区图与月度图使用“多渲染一行/多个月 + 裁切容器平移”的无缝循环方式，克隆数据只参与视觉滚动，不参与合计。


## 最后验收成果

- Node.js 版本: v22.19.0
- 安装依赖：详见上方主要依赖部分
- 启动和构建命令：详见上方本地运行部分
- 基础内容完成情况：编号1-7模块全部完成并正常渲染
- 扩展项完成情况：A1-A7内容也全部完成并正常渲染
