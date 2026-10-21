<script setup lang="ts">
import { computed } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import {
  CHART_AXIS_LINE_COLOR,
  CHART_SPLIT_LINE_COLOR,
  CHART_TEXT_COLOR,
  CHART_TEXT_MUTED_COLOR,
  PRIMARY_COLOR
} from '@/data/palette'
import { formatThousands } from '@/utils/format'

import type { PointsItem, PointsViewMode } from '@/types/dashboard'

interface Props {
  /** 当前视图对应的数据（类型视图或月度视图） */
  data: PointsItem[]
  /** 当前视图模式，仅用于提示框与系列命名 */
  viewMode: PointsViewMode
  /** 图表高度（px） */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 308
})

/** 类目较多（月度视图 12 个）时收窄标签并旋转横轴文字，避免标签互相压盖 */
const isDense = computed(() => props.data.length > 8)

const viewLabel = computed(() => (props.viewMode === 'type' ? '按类型' : '按月份'))

const option = computed<EChartsOption>(() => {
  const dense = isDense.value

  return {
    grid: { left: 4, right: 12, top: 34, bottom: 2, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderWidth: 0,
      padding: [6, 10],
      textStyle: { color: '#f8fafc', fontSize: 12 },
      valueFormatter: (value) => `${formatThousands(Number(value))} 积分`
    },
    xAxis: {
      type: 'category',
      data: props.data.map((item) => item.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: CHART_AXIS_LINE_COLOR } },
      axisLabel: {
        color: CHART_TEXT_COLOR,
        fontSize: 11,
        interval: 0,
        rotate: dense ? 32 : 0,
        margin: dense ? 8 : 10
      }
    },
    yAxis: {
      type: 'value',
      // 坐标轴名称明确计量单位
      name: '积分',
      nameTextStyle: { color: CHART_TEXT_MUTED_COLOR, fontSize: 11, align: 'left', padding: [0, 0, 2, -4] },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: CHART_TEXT_MUTED_COLOR,
        fontSize: 11,
        formatter: (value: number) => formatThousands(value)
      },
      splitLine: { lineStyle: { color: CHART_SPLIT_LINE_COLOR, type: 'dashed' } },
      // 顶部留出空间给柱体数值标签
      max: (extent: { max: number }) => Math.ceil((extent.max * 1.15) / 1000) * 1000
    },
    series: [
      {
        name: `积分发放（${viewLabel.value}）`,
        type: 'bar',
        data: props.data.map((item) => item.value),
        barMaxWidth: dense ? 20 : 30,
        itemStyle: {
          color: PRIMARY_COLOR,
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: { itemStyle: { color: '#1d4ed8' } },
        label: {
          show: true,
          position: 'top',
          distance: 4,
          color: CHART_TEXT_COLOR,
          fontSize: dense ? 10 : 11,
          fontWeight: 600,
          formatter: (params) => formatThousands(Number(params.value))
        }
      }
    ]
  }
})

/** 当前视图合计积分（供副标题展示使用，由父组件透传展示） */
</script>

<template>
  <BaseEChart :option="option" :height="height" :aria-label="`积分发放${viewLabel}竖向柱状图`" />
</template>
