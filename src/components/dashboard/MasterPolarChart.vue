<script setup lang="ts">
import { computed } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import ChartLegend from '@/components/dashboard/ChartLegend.vue'
import {
  CHART_AXIS_LINE_COLOR,
  CHART_SPLIT_LINE_COLOR,
  CHART_TEXT_COLOR,
  MASTER_LEVEL_COLORS
} from '@/data/palette'
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

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 0,
    padding: [6, 10],
    textStyle: { color: '#f8fafc', fontSize: 12 },
    formatter: (params) => {
      const data = params as { name?: string; value?: number | string }
      return `${data.name ?? ''}级劳模工匠<br/>人数：${formatThousands(Number(data.value ?? 0))} 人`
    }
  },
  polar: {
    center: ['50%', '50%'],
    radius: ['22%', '76%']
  },
  angleAxis: {
    type: 'category',
    data: props.data.map((item) => item.level),
    startAngle: 90,
    axisLine: { lineStyle: { color: CHART_AXIS_LINE_COLOR } },
    axisTick: { show: false },
    axisLabel: { color: CHART_TEXT_COLOR, fontSize: 12, margin: 10 }
  },
  radiusAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    // 极坐标数值轴的刻度文字容易与柱体、角度轴标签重叠，
    // 具体数值由图例与提示框给出，这里只保留网格环
    axisLabel: { show: false },
    splitLine: { lineStyle: { color: CHART_SPLIT_LINE_COLOR, type: 'dashed' } }
  },
  series: [
    {
      name: '劳模工匠',
      type: 'bar',
      coordinateSystem: 'polar',
      barCategoryGap: '48%',
      // 颜色随级别变化，柱体长度始终由真实数值决定
      data: props.data.map((item, index) => ({
        value: item.value,
        itemStyle: { color: colorOf(index), borderRadius: [4, 4, 0, 0] }
      })),
      emphasis: { focus: 'self' }
    }
  ]
}))
</script>

<template>
  <div class="polar">
    <BaseEChart class="polar__chart" :option="option" :height="height" aria-label="劳模工匠级别极坐标柱状图" />
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
