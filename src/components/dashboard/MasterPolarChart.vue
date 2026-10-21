<script setup lang="ts">
import { computed } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import ChartLegend from '@/components/dashboard/ChartLegend.vue'
import { CHART_SPLIT_LINE_COLOR, MASTER_LEVEL_COLORS } from '@/data/palette'
import { formatThousands } from '@/utils/format'

import type { ChartLegendItem } from '@/types/chart'
import type { MasterLevelItem } from '@/types/dashboard'

interface Props {
  /** 劳模工匠级别数据 */
  data: MasterLevelItem[]
  /** 图表高度（px） */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

/** 每个级别对应固定颜色，图例与柱体取同一份色板，保证映射一致 */
const colorOf = (index: number): string => MASTER_LEVEL_COLORS[index % MASTER_LEVEL_COLORS.length]

const legendItems = computed<ChartLegendItem[]>(() =>
  props.data.map((item, index) => ({
    name: item.level,
    value: item.value,
    color: colorOf(index)
  }))
)

/**
 * 角度轴上限：为最大值留约 5% 余量并取整，
 * 避免最长的一条圆头柱正好绕满一周而与起点重叠。
 */
const angleMax = computed(() => {
  const peak = Math.max(1, ...props.data.map((item) => item.value))
  const rough = peak * 1.05
  const step = 10 ** Math.max(0, Math.floor(Math.log10(rough)) - 1)
  return Math.ceil(rough / step) * step
})

/**
 * 极坐标圆角柱：级别放在半径轴（类目轴），人数放在角度轴。
 * 这样柱体沿切向生长，ECharts 的 `roundCap` 才会生效；
 * 若把级别放在角度轴上，柱体沿径向生长，`roundCap` 会被忽略，
 * 只能得到没有圆头的楔形柱。
 */
const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 0,
    padding: [6, 10],
    textStyle: { color: '#f8fafc', fontSize: 12 },
    formatter: (params) => {
      const data = params as { name?: string; value?: number | string }
      return `${data.name ?? ''}劳模工匠<br/>人数：${formatThousands(Number(data.value ?? 0))} 人`
    }
  },
  polar: {
    center: ['50%', '50%'],
    radius: ['20%', '82%']
  },
  angleAxis: {
    type: 'value',
    min: 0,
    max: angleMax.value,
    startAngle: 90,
    clockwise: true,
    axisLine: { show: false },
    axisTick: { show: false },
    // 圆周刻度容易与圆头柱端部重叠，具体数值由图例和提示框给出
    axisLabel: { show: false },
    splitLine: { lineStyle: { color: CHART_SPLIT_LINE_COLOR, type: 'dashed' } }
  },
  radiusAxis: {
    type: 'category',
    data: props.data.map((item) => item.level),
    axisLine: { show: false },
    axisTick: { show: false },
    // 类目名称由图例承担，避免沿半径方向排布时与柱体叠字
    axisLabel: { show: false },
    splitLine: { show: false }
  },
  series: [
    {
      name: '劳模工匠',
      type: 'bar',
      coordinateSystem: 'polar',
      // 切向极坐标柱才支持 roundCap，圆头效果由 ECharts 5.6 原生绘制
      roundCap: true,
      barWidth: '62%',
      // 背景轨道用于呈现每条柱体在角度轴上的完整量程
      showBackground: true,
      backgroundStyle: { color: '#f3f6fa' },
      // 颜色随级别变化，柱体弧长始终由真实数值决定
      data: props.data.map((item, index) => ({
        name: item.level,
        value: item.value,
        itemStyle: { color: colorOf(index) }
      })),
      emphasis: { focus: 'self' }
    }
  ]
}))
</script>

<template>
  <div class="polar">
    <BaseEChart
      class="polar__chart"
      :option="option"
      :height="height"
      aria-label="劳模工匠级别极坐标圆角柱状图"
    />
    <ChartLegend class="polar__legend" :items="legendItems" unit="人" direction="side" />
  </div>
</template>

<style scoped>
.polar {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.polar__chart {
  flex: 1 1 auto;
  min-width: 0;
}

.polar__legend {
  flex: 0 0 auto;
}
</style>
