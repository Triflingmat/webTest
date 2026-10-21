<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import { ANIMATION_DURATION, CAROUSEL_EASING, CHART_ANIMATION } from '@/config/animation'
import { useCarousel } from '@/composables/useCarousel'
import {
  CHART_SPLIT_LINE_COLOR,
  CHART_TEXT_COLOR,
  REGION_BAR_COLORS
} from '@/data/palette'
import { formatThousands } from '@/utils/format'

import type { RegionReadItem } from '@/types/dashboard'

interface Props {
  /** 各地区阅读用户数 */
  data: RegionReadItem[]
  /** 可视区域高度（px），始终展示 3 条 */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

/** 初始化时仅排序一次；后续滚动只移动窗口，不改变基础顺序 */
const ranked = computed(() => [...props.data].sort((a, b) => b.value - a.value))

/** 三行可视，因此单行高度为总高度的 1/3 */
const rowHeight = computed(() => props.height / 3)

/**
 * 视觉轨道比基础数据多 3 条：A B C D E A B C。
 * 这样滚动到第 5 个窗口时仍是 A B C，可在无感状态下回到轨道起点。
 */
const repeatedRows = computed(() => {
  const rows = ranked.value
  return [...rows, ...rows.slice(0, 3)].map((item, index) => ({
    ...item,
    colorIndex: index % (rows.length || 1)
  }))
})

const chartHeight = computed(() => Math.max(1, Math.round(rowHeight.value * repeatedRows.value.length)))

const scrollOffset = ref(0)
const instantReset = ref(false)
let resetFrame = 0
let disposed = false

/** 当前可视窗口，供浏览器验收直接读取（例如 "城东区 城西区 城南区"） */
const visibleWindow = computed(() => {
  const rows = ranked.value
  if (!rows.length) return ''

  return Array.from({ length: 3 }, (_, index) => {
    return rows[(scrollOffset.value + index) % rows.length]?.name ?? ''
  }).join(' ')
})

const trackStyle = computed(() => ({
  transform: `translateY(-${scrollOffset.value * rowHeight.value}px)`,
  transition: instantReset.value
    ? 'none'
    : `transform ${ANIMATION_DURATION}ms ${CAROUSEL_EASING}`
}))

const option = computed<EChartsOption>(() => {
  const rows = repeatedRows.value

  return {
    ...CHART_ANIMATION,
    animationDelay: 0,
    grid: { left: 4, right: 72, top: 0, bottom: 0, containLabel: true },
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
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: CHART_SPLIT_LINE_COLOR, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: CHART_TEXT_COLOR, fontSize: 12, margin: 10 }
    },
    series: [
      {
        name: '阅读用户数',
        type: 'bar',
        data: rows.map((item) => ({
          value: item.value,
          itemStyle: {
            color: REGION_BAR_COLORS[Math.min(item.colorIndex, REGION_BAR_COLORS.length - 1)],
            borderRadius: [0, 4, 4, 0]
          }
        })),
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

/** 从第 5 个窗口（A B C）无感回到轨道起点，再推进到 B C D */
function restartScroll(): void {
  instantReset.value = true
  scrollOffset.value = 0

  resetFrame = window.requestAnimationFrame(() => {
    resetFrame = window.requestAnimationFrame(() => {
      resetFrame = 0
      if (disposed) return
      instantReset.value = false
      scrollOffset.value = 1
    })
  })
}

function advance(): void {
  if (!ranked.value.length || disposed) return

  if (scrollOffset.value >= ranked.value.length) {
    restartScroll()
    return
  }

  scrollOffset.value += 1
}

useCarousel(advance)

onBeforeUnmount(() => {
  disposed = true
  if (resetFrame) {
    window.cancelAnimationFrame(resetFrame)
    resetFrame = 0
  }
})
</script>

<template>
  <div
    class="region-scroll"
    :data-total-rows="ranked.length"
    :data-visible-count="3"
    :data-visible-window="visibleWindow"
  >
    <div class="region-scroll__viewport" :style="{ height: `${height}px` }">
      <div class="region-scroll__track" :style="trackStyle">
        <BaseEChart
          :option="option"
          :height="chartHeight"
          aria-label="阅读用户地区分布横向柱状图，三条数据循环向上滚动"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.region-scroll {
  min-width: 0;
}

.region-scroll__viewport {
  overflow: hidden;
  /* 上下边缘渐隐，让进入/离开窗口的数据自然过渡 */
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 18px,
    #000 calc(100% - 18px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 18px,
    #000 calc(100% - 18px),
    transparent 100%
  );
}

.region-scroll__track {
  will-change: transform;
}
</style>
