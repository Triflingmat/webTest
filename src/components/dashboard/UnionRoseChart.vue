<script setup lang="ts">
import { computed } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import ChartLegend from '@/components/dashboard/ChartLegend.vue'
import { UNION_ORG_COLORS } from '@/data/palette'
import { formatShare, formatThousands, sumValues } from '@/utils/format'

import type { ChartLegendItem } from '@/types/chart'
import type { CategoryShareItem } from '@/types/dashboard'

interface Props {
  /** 工会组织类型分布数据 */
  data: CategoryShareItem[]
  /** 玫瑰图高度（px） */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 206
})

const total = computed(() => sumValues(props.data))

const legendItems = computed<ChartLegendItem[]>(() =>
  props.data.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: UNION_ORG_COLORS[index % UNION_ORG_COLORS.length],
    share: formatShare(item.value, total.value)
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
      const value = Number(data.value ?? 0)
      return `${data.name ?? ''}工会<br/>数量：${formatThousands(value)} 家<br/>占比：${formatShare(value, total.value)}%`
    }
  },
  series: [
    {
      name: '工会组织',
      type: 'pie',
      // roseType = 'radius'：扇区半径随数值变化，而不是等半径
      roseType: 'radius',
      radius: ['18%', '78%'],
      center: ['50%', '50%'],
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 3
      },
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 4 },
      data: props.data.map((item, index) => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: UNION_ORG_COLORS[index % UNION_ORG_COLORS.length] }
      }))
    }
  ]
}))
</script>

<template>
  <div class="rose">
    <BaseEChart class="rose__chart" :option="option" :height="height" aria-label="工会组织类型玫瑰图" />
    <ChartLegend class="rose__legend" :items="legendItems" unit="家" direction="row" />
  </div>
</template>

<style scoped>
.rose {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
</style>
