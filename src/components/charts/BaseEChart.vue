<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import { echarts, type EChartsInstance, type EChartsOption } from './echarts'

interface Props {
  /** ECharts 配置项，变化时自动更新图表 */
  option: EChartsOption
  /** 图表容器高度（px） */
  height?: number
  /** 是否跟随容器尺寸自动 resize */
  autoResize?: boolean
  /** 无障碍描述 */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 280,
  autoResize: true,
  ariaLabel: ''
})

/** 容器尺寸为 0 时最多重试的帧数，避免无限空转 */
const MAX_INIT_ATTEMPTS = 60

const containerRef = ref<HTMLDivElement | null>(null)
const chartRef = shallowRef<EChartsInstance | null>(null)

let resizeObserver: ResizeObserver | null = null
let resizeFrame = 0
let initFrame = 0
let initAttempts = 0

/** 容器是否已具备可绘制尺寸 */
function hasRenderableSize(): boolean {
  const el = containerRef.value
  return !!el && el.clientWidth > 0 && el.clientHeight > 0
}

/** 初始化实例；尺寸为 0 时等下一帧重试，避免零尺寸初始化导致图表空白 */
function initChart(): void {
  if (chartRef.value || !containerRef.value) return

  if (!hasRenderableSize()) {
    initAttempts += 1
    if (initAttempts <= MAX_INIT_ATTEMPTS) {
      initFrame = window.requestAnimationFrame(initChart)
    }
    return
  }

  const instance = echarts.init(containerRef.value, undefined, { renderer: 'canvas' })
  instance.setOption(props.option)
  chartRef.value = instance

  if (props.autoResize) {
    // ResizeObserver 覆盖容器自身尺寸变化（栅格重排、侧边栏折叠等）
    resizeObserver = new ResizeObserver(scheduleResize)
    resizeObserver.observe(containerRef.value)
    // 窗口 resize 作为兜底（例如浏览器缩放、窗口拖拽）
    window.addEventListener('resize', scheduleResize)
  }
}

/** 合并同一帧内的多次尺寸变化，减少重绘压力 */
function scheduleResize(): void {
  if (resizeFrame) return
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0
    resizeChart()
  })
}

function resizeChart(): void {
  const instance = chartRef.value
  if (!instance || instance.isDisposed() || !hasRenderableSize()) return
  instance.resize()
}

watch(
  () => props.option,
  (nextOption) => {
    const instance = chartRef.value
    if (!instance || instance.isDisposed()) {
      // 实例尚未就绪（例如首帧尺寸为 0），重新走初始化流程
      initChart()
      return
    }
    // notMerge 保证切换数据集（如类型视图 → 月度视图）时不残留旧系列
    instance.setOption(nextOption, { notMerge: true })
  },
  { deep: true, flush: 'post' }
)

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  if (initFrame) {
    window.cancelAnimationFrame(initFrame)
    initFrame = 0
  }
  if (resizeFrame) {
    window.cancelAnimationFrame(resizeFrame)
    resizeFrame = 0
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  window.removeEventListener('resize', scheduleResize)

  const instance = chartRef.value
  if (instance && !instance.isDisposed()) {
    instance.dispose()
  }
  chartRef.value = null
})

defineExpose({ resize: resizeChart })
</script>

<template>
  <div
    ref="containerRef"
    class="base-echart"
    :style="{ height: `${height}px` }"
    :aria-label="ariaLabel || undefined"
    role="img"
  />
</template>

<style scoped>
.base-echart {
  width: 100%;
  min-height: 160px;
}
</style>
