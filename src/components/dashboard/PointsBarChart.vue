<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import { ANIMATION_DURATION, CAROUSEL_EASING, CHART_ANIMATION } from '@/config/animation'
import { useCarousel } from '@/composables/useCarousel'
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
  /** 当前视图对应的数据（类型视图或 12 个月数据） */
  data: PointsItem[]
  /** 当前视图模式 */
  viewMode: PointsViewMode
  /** 图表高度（px） */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 308
})

/** 月度视图始终显示 6 个连续月份 */
const VISIBLE_MONTHS = 6

/** 月度轨道在 12 个月后追加 6 个月，保证跨年窗口连续 */
const monthTrack = computed(() => [...props.data, ...props.data.slice(0, VISIBLE_MONTHS)])

/** 月度轨道一次平移一个月，占整条轨道的 1/18 */
const monthStepPercent = computed(() =>
  monthTrack.value.length ? 100 / monthTrack.value.length : 0
)

const monthOffset = ref(0)
const instantReset = ref(false)
let resetFrame = 0
let disposed = false

const monthTrackStyle = computed(() => ({
  transform: `translateX(-${monthOffset.value * monthStepPercent.value}%)`,
  transition: instantReset.value
    ? 'none'
    : `transform ${ANIMATION_DURATION}ms ${CAROUSEL_EASING}`
}))

/** 当前可视窗口，例如「1月 — 6月」「8月 — 1月」 */
const monthWindowLabel = computed(() => {
  if (!props.data.length) return ''
  const start = monthOffset.value % props.data.length
  const end = (start + VISIBLE_MONTHS - 1) % props.data.length
  return `${props.data[start]?.name ?? ''} — ${props.data[end]?.name ?? ''}`
})

const typeOption = computed<EChartsOption>(() => ({
  ...CHART_ANIMATION,
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
      margin: 10
    }
  },
  yAxis: {
    type: 'value',
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
    max: (extent: { max: number }) => Math.ceil((extent.max * 1.15) / 1000) * 1000
  },
  series: [
    {
      name: '积分发放（按类型）',
      type: 'bar',
      data: props.data.map((item) => item.value),
      barMaxWidth: 30,
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
        fontSize: 11,
        fontWeight: 600,
        formatter: (params) => formatThousands(Number(params.value))
      }
    }
  ]
}))

const monthOption = computed<EChartsOption>(() => {
  const months = monthTrack.value

  return {
    ...CHART_ANIMATION,
    grid: { left: 0, right: 0, top: 34, bottom: 2, containLabel: true },
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
      data: months.map((item) => item.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: CHART_AXIS_LINE_COLOR } },
      axisLabel: {
        color: CHART_TEXT_COLOR,
        fontSize: 11,
        interval: 0,
        margin: 10
      }
    },
    yAxis: {
      type: 'value',
      // 横向滚动时纵轴数字会随画布移出视口，具体数值由柱顶标签与提示框承担
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: CHART_SPLIT_LINE_COLOR, type: 'dashed' } },
      max: (extent: { max: number }) => Math.ceil((extent.max * 1.15) / 1000) * 1000
    },
    series: [
      {
        name: '积分发放（按月份）',
        type: 'bar',
        data: months.map((item) => item.value),
        barMaxWidth: 22,
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
          fontSize: 10,
          fontWeight: 600,
          formatter: (params) => formatThousands(Number(params.value))
        }
      }
    ]
  }
})

function clearResetFrame(): void {
  if (resetFrame) {
    window.cancelAnimationFrame(resetFrame)
    resetFrame = 0
  }
}

function restartMonthScroll(): void {
  instantReset.value = true
  monthOffset.value = 0

  resetFrame = window.requestAnimationFrame(() => {
    resetFrame = window.requestAnimationFrame(() => {
      resetFrame = 0
      if (disposed || props.viewMode !== 'month') return
      instantReset.value = false
      monthOffset.value = 1
    })
  })
}

function advanceMonth(): void {
  if (props.viewMode !== 'month' || !props.data.length || disposed) return

  if (monthOffset.value >= props.data.length) {
    restartMonthScroll()
    return
  }

  monthOffset.value += 1
}

const { start: startCarousel, stop: stopCarousel } = useCarousel(advanceMonth, { autoStart: false })

watch(
  () => props.viewMode,
  (mode) => {
    stopCarousel()
    clearResetFrame()
    instantReset.value = false
    monthOffset.value = 0

    if (mode === 'month') startCarousel()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  disposed = true
  clearResetFrame()
})
</script>

<template>
  <div class="points-chart">
    <BaseEChart
      v-if="viewMode === 'type'"
      :option="typeOption"
      :height="height"
      aria-label="积分发放按类型竖向柱状图"
    />

    <div
      v-else
      class="points-month"
      :style="{ height: `${height}px` }"
      :data-visible-count="VISIBLE_MONTHS"
      :data-total-months="props.data.length"
      :data-visible-window="monthWindowLabel"
    >
      <div class="points-month__viewport">
        <div class="points-month__track" :style="monthTrackStyle">
          <BaseEChart
            :option="monthOption"
            :height="height"
            aria-label="积分发放按月份竖向柱状图，六个月窗口向左循环滚动"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.points-chart {
  min-width: 0;
}

.points-month {
  position: relative;
  overflow: hidden;
}

.points-month__viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.points-month__track {
  width: 300%;
  height: 100%;
  will-change: transform;
}
</style>
