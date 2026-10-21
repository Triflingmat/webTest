/**
 * ECharts 按需注册（模块化引入）。
 *
 * 只注册本项目实际使用的图表（bar / pie）与组件（grid / polar / tooltip / legend /
 * axisPointer）以及 Canvas 渲染器，避免把整个 echarts 包打进产物。
 *
 * 类型层面为了书写方便，图表 option 使用官方完整的 `EChartsOption` 类型；
 * 该导入是 type-only，不会影响运行时体积。
 */

import { BarChart, PieChart } from 'echarts/charts'
import {
  AxisPointerComponent,
  GridComponent,
  LegendComponent,
  PolarComponent,
  TooltipComponent
} from 'echarts/components'
import * as echartsCore from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

import type { EChartsOption } from 'echarts'

echartsCore.use([
  BarChart,
  PieChart,
  GridComponent,
  PolarComponent,
  LegendComponent,
  TooltipComponent,
  AxisPointerComponent,
  CanvasRenderer
])

/** ECharts 实例类型（与 echarts.init 返回值一致） */
export type EChartsInstance = ReturnType<typeof echartsCore.init>

export { echartsCore as echarts }
export type { EChartsOption }
