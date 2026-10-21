<script setup lang="ts">
import { computed } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import ChartLegend from '@/components/dashboard/ChartLegend.vue'
import { CHART_ANIMATION } from '@/config/animation'
import {
  USER_TYPE_GRADIENTS,
  toCssGradient,
  toEChartsGradient
} from '@/data/palette'
import { formatShare, formatThousands, sumValues } from '@/utils/format'

import type { ChartLegendItem } from '@/types/chart'
import type { CategoryShareItem } from '@/types/dashboard'

interface Props {
  /** 用户类型分布数据 */
  data: CategoryShareItem[]
  /** 环形图高度（px） */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 230
})

/** 总用户数由明细数据求和得出，保证与环图中心文案、图例占比一致 */
const total = computed(() => sumValues(props.data))

const legendItems = computed<ChartLegendItem[]>(() =>
  props.data.map((item, index) => {
    const gradient = USER_TYPE_GRADIENTS[index % USER_TYPE_GRADIENTS.length]
    return {
      name: item.name,
      value: item.value,
      color: gradient.from,
      gradient: toCssGradient(gradient),
      share: formatShare(item.value, total.value)
    }
  })
)

const option = computed<EChartsOption>(() => ({
  ...CHART_ANIMATION,
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 0,
    padding: [6, 10],
    textStyle: { color: '#f8fafc', fontSize: 12 },
    formatter: (params) => {
      const data = params as { name?: string; value?: number | string }
      const value = Number(data.value ?? 0)
      const share = formatShare(value, total.value)
      return `${data.name ?? ''}<br/>用户数：${formatThousands(value)} 人<br/>占比：${share}%`
    }
  },
  series: [
    {
      name: '用户类型',
      type: 'pie',
      radius: ['54%', '78%'],
      center: ['50%', '50%'],
      // 首次入场时所有扇区从当前起始角连续展开到目标角度
      animationType: 'expansion',
      // padAngle + 描边共同保证扇区之间有明显间隙（兼容低版本 ECharts）
      padAngle: 2,
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 4
      },
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 4 },
      data: props.data.map((item, index) => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: toEChartsGradient(USER_TYPE_GRADIENTS[index % USER_TYPE_GRADIENTS.length])
        }
      }))
    }
  ]
}))
</script>

<template>
  <div class="donut">
    <div class="donut__chart">
      <BaseEChart :option="option" :height="height" aria-label="用户类型环形饼图" />
      <!-- 中心文案与数据总和保持一致 -->
      <div class="donut__center" aria-hidden="true">
        <p class="donut__center-value">
          {{ formatThousands(total) }}<em>人</em>
        </p>
        <p class="donut__center-label">总用户数</p>
      </div>
    </div>
    <ChartLegend class="donut__legend" :items="legendItems" unit="人" direction="row" />
  </div>
</template>

<style scoped>
.donut {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.donut__chart {
  position: relative;
  min-width: 0;
}

.donut__center {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.donut__center-value {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 26px;
  color: var(--color-text-strong);
  font-variant-numeric: tabular-nums;
}

.donut__center-value em {
  margin-left: 2px;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  color: var(--color-text-muted);
}

.donut__center-label {
  margin: 0;
  font-size: 11px;
  line-height: 16px;
  color: var(--color-text-muted);
}

.donut__legend {
  margin-top: -2px;
}
</style>
