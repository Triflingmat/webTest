<script setup lang="ts">
import type { ChartLegendItem } from '@/types/chart'

interface Props {
  items: ChartLegendItem[]
  /** 数值单位 */
  unit?: string
  /**
   * 布局方向：
   * - row：整行铺满（适合放在图表下方）
   * - side：窄列（适合放在图表右侧）
   */
  direction?: 'row' | 'side'
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  direction: 'row'
})

function formatValue(value: number): string {
  return value.toLocaleString('zh-CN')
}

/** 仅整行布局展示占比，避免窄列被挤压 */
function showShare(item: ChartLegendItem): boolean {
  return props.direction === 'row' && !!item.share
}
</script>

<template>
  <ul class="chart-legend" :class="`chart-legend--${direction}`">
    <li v-for="item in items" :key="item.name" class="chart-legend__item">
      <span class="chart-legend__dot" :style="{ backgroundColor: item.color }" />
      <span class="chart-legend__name" :title="item.name">{{ item.name }}</span>
      <span class="chart-legend__meta">
        <span class="chart-legend__value">{{ formatValue(item.value) }}<em v-if="unit">{{ unit }}</em></span>
        <span v-if="showShare(item)" class="chart-legend__share">{{ item.share }}%</span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
.chart-legend {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chart-legend--row {
  flex-direction: column;
  gap: 2px;
}

.chart-legend--side {
  flex-direction: column;
  gap: 4px;
  min-width: 96px;
}

.chart-legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 18px;
  color: #334155;
}

.chart-legend__item:hover {
  background-color: #f4f7fb;
}

.chart-legend--side .chart-legend__item {
  padding: 2px 4px;
}

.chart-legend__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-legend__name {
  flex: 0 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
}

.chart-legend__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.chart-legend__value {
  color: #0f172a;
  font-weight: 600;
  white-space: nowrap;
}

.chart-legend__value em {
  margin-left: 2px;
  color: #64748b;
  font-style: normal;
  font-weight: 400;
}

.chart-legend__share {
  min-width: 44px;
  color: #64748b;
  text-align: right;
  white-space: nowrap;
}
</style>
