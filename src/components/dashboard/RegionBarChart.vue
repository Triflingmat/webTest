<script setup lang="ts">
import { computed } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import {
  CHART_SPLIT_LINE_COLOR,
  CHART_TEXT_COLOR,
  CHART_TEXT_MUTED_COLOR,
  REGION_BAR_COLORS
} from '@/data/palette'
import { formatThousands } from '@/utils/format'

import type { RegionReadItem } from '@/types/dashboard'

interface Props {
  /** 各地区阅读用户数 */
  data: RegionReadItem[]
  /** 图表高度（px） */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 378
})

/** 按阅读人数从高到低排序，类目轴自下而上渲染，保证最大值出现在顶部 */
const ranked = computed(() => [...props.data].sort((a, b) => b.value - a.value))

const option = computed<EChartsOption>(() => {
  const list = ranked.value

  return {
    grid: { left: 4, right: 74, top: 10, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderWidth: 0,
      padding: [6, 10],
      textStyle: { color: '#f8fafc', fontSize: 12 },
      valueFormatter: (value) => `${formatThousands(Number(value))} 人`
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: CHART_TEXT_MUTED_COLOR,
        fontSize: 11,
        formatter: (value: number) => formatThousands(value)
      },
      splitLine: { lineStyle: { color: CHART_SPLIT_LINE_COLOR, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      // 升序排列后自下而上绘制，顶部即最大值
      data: list.map((item) => item.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: CHART_TEXT_COLOR, fontSize: 12, margin: 10 }
    },
    series: [
      {
        name: '阅读用户数',
        type: 'bar',
        // 颜色按排名取色阶（只影响观感，柱长始终由数值决定）
        data: list
          .map((item, index) => ({
            value: item.value,
            itemStyle: {
              color: REGION_BAR_COLORS[Math.min(index, REGION_BAR_COLORS.length - 1)],
              borderRadius: [0, 4, 4, 0]
            }
          }))
          .reverse(),
        barMaxWidth: 16,
        barCategoryGap: '42%',
        label: {
          show: true,
          position: 'right',
          distance: 8,
          color: CHART_TEXT_COLOR,
          fontSize: 12,
          fontWeight: 600,
          formatter: (params) => `${formatThousands(Number(params.value))} 人`
        }
      }
    ]
  }
})
</script>

<template>
  <BaseEChart :option="option" :height="height" aria-label="阅读用户地区分布横向柱状图" />
</template>
