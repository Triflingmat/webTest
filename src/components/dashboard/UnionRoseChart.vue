<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import BaseEChart from '@/components/charts/BaseEChart.vue'
import type { EChartsOption } from '@/components/charts/echarts'
import ChartLegend from '@/components/dashboard/ChartLegend.vue'
import { CHART_ANIMATION } from '@/config/animation'
import { UNION_ORG_COLORS, UNION_ORG_IMAGES } from '@/data/palette'
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

/** 素材加载状态：逐个记录，单张失败时只隐藏该图片，图表仍可用 */
const imagesReady = ref(false)
const loadedImages = ref<Record<string, boolean>>({})
const loadedImageCount = computed(
  () => Object.values(loadedImages.value).filter(Boolean).length
)
let disposed = false

onMounted(async () => {
  const entries = Object.entries(UNION_ORG_IMAGES)
  const results = await Promise.all(
    entries.map(
      ([name, asset]) =>
        new Promise<[string, boolean]>((resolve) => {
          const image = new Image()
          image.onload = () => resolve([name, true])
          image.onerror = () => resolve([name, false])
          image.src = asset.src
        })
    )
  )

  if (disposed) return
  loadedImages.value = Object.fromEntries(results)
  imagesReady.value = true
})

onBeforeUnmount(() => {
  disposed = true
})

const legendItems = computed<ChartLegendItem[]>(() =>
  props.data.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: UNION_ORG_COLORS[index % UNION_ORG_COLORS.length],
    share: formatShare(item.value, total.value)
  }))
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
      // 玫瑰图入场时扇区从零角度展开，图片标签随扇区一起定位
      animationType: 'expansion',
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 3
      },
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 4 },
      data: props.data.map((item, index) => {
        const asset = UNION_ORG_IMAGES[item.name]
        const showImage = !!asset && !!loadedImages.value[item.name]

        return {
          name: item.name,
          value: item.value,
          itemStyle: { color: UNION_ORG_COLORS[index % UNION_ORG_COLORS.length] },
          label: {
            show: showImage,
            position: 'inside',
            silent: true,
            formatter: '{orgImage|}',
            rich: {
              orgImage: {
                width: asset?.width ?? 0,
                height: asset?.height ?? 0,
                backgroundColor: asset ? { image: asset.src } : undefined,
                align: 'center',
                verticalAlign: 'middle'
              }
            }
          }
        }
      })
    }
  ]
}))
</script>

<template>
  <div
    class="rose"
    :data-loaded-images="loadedImageCount"
    :data-images-ready="imagesReady"
  >
    <BaseEChart
      v-if="imagesReady"
      class="rose__chart"
      :option="option"
      :height="height"
      aria-label="工会组织类型玫瑰图，扇区内嵌组织类别图片"
    />
    <div v-else class="rose__placeholder" :style="{ height: `${height}px` }" aria-hidden="true" />
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

.rose__placeholder {
  width: 100%;
}
</style>
