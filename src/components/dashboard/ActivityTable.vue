<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

import { ANIMATION_DURATION, CAROUSEL_EASING } from '@/config/animation'
import { useCarousel } from '@/composables/useCarousel'
import { formatThousands } from '@/utils/format'

import type { ActivityRow } from '@/types/dashboard'

interface Props {
  /** 工会活动列表（按排名升序） */
  data: ActivityRow[]
}

const props = defineProps<Props>()

/** 可视区域固定展示 4 行 */
const VISIBLE_ROWS = 4
const ROW_HEIGHT = 56

const rows = computed(() => props.data)

/**
 * 7 条真实数据 + 前 4 条克隆，用于首尾视觉衔接。
 * 克隆行只参与滚动展示，不参与合计和行数统计。
 */
const displayRows = computed(() => [
  ...rows.value,
  ...rows.value.slice(0, VISIBLE_ROWS)
])

const scrollOffset = ref(0)
const instantReset = ref(false)
let resetFrame = 0
let disposed = false

const trackStyle = computed(() => ({
  transform: `translateY(-${scrollOffset.value * ROW_HEIGHT}px)`,
  transition: instantReset.value
    ? 'none'
    : `transform ${ANIMATION_DURATION}ms ${CAROUSEL_EASING}`
}))

/** 表尾合计始终由 7 条基础数据计算 */
const totalParticipants = computed(() =>
  rows.value.reduce((total, item) => total + item.participants, 0)
)

/** 当前可视窗口中的排名，供浏览器验收读取 */
const visibleWindow = computed(() => {
  if (!rows.value.length) return ''

  return Array.from({ length: VISIBLE_ROWS }, (_, index) => {
    return String(rows.value[(scrollOffset.value + index) % rows.value.length]?.rank ?? '')
  }).join(' ')
})

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
  if (!rows.value.length || disposed) return

  // 偏移到第 7 个窗口时，可视内容与初始窗口一致，可无感复位
  if (scrollOffset.value >= rows.value.length) {
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
    class="activity-table"
    :data-total-rows="rows.length"
    :data-visible-count="VISIBLE_ROWS"
    :data-visible-window="visibleWindow"
  >
    <div class="activity-table__header">
      <table class="activity-table__table">
        <colgroup>
          <col class="col-rank" />
          <col class="col-name" />
          <col class="col-category" />
          <col class="col-participants" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" class="is-center">排名</th>
            <th scope="col">活动名称</th>
            <th scope="col" class="is-center">分类</th>
            <th scope="col" class="is-end">参与人次</th>
          </tr>
        </thead>
      </table>
    </div>

    <div class="activity-table__viewport" :style="{ height: `${VISIBLE_ROWS * ROW_HEIGHT}px` }">
      <div class="activity-table__track" :style="trackStyle">
        <table class="activity-table__table">
          <colgroup>
            <col class="col-rank" />
            <col class="col-name" />
            <col class="col-category" />
            <col class="col-participants" />
          </colgroup>
          <tbody>
            <tr
              v-for="(row, index) in displayRows"
              :key="`${row.rank}-${index}`"
              :style="{ height: `${ROW_HEIGHT}px` }"
            >
              <td class="is-center">
                <span class="activity-table__rank" :class="{ 'is-top': row.rank <= 3 }">
                  {{ row.rank }}
                </span>
              </td>
              <td class="activity-table__name" :title="row.name">{{ row.name }}</td>
              <td class="is-center">
                <span class="activity-table__tag">{{ row.category }}</span>
              </td>
              <td class="is-end activity-table__value">
                {{ formatThousands(row.participants) }}<em>人次</em>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="activity-table__footer">
      共 {{ rows.length }} 项活动 · 累计参与
      <strong>{{ formatThousands(totalParticipants) }}</strong>
      人次
    </p>
  </div>
</template>

<style scoped>
.activity-table {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.activity-table__header {
  flex: none;
  overflow: hidden;
  background-color: #f1f5fb;
  border-bottom: 1px solid var(--color-border);
}

.activity-table__viewport {
  flex: none;
  overflow: hidden;
  background-color: #ffffff;
}

.activity-table__track {
  will-change: transform;
}

.activity-table__table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12px;
}

.col-rank {
  width: 54px;
}

.col-name {
  width: auto;
}

.col-category {
  width: 82px;
}

.col-participants {
  width: 104px;
}

.activity-table__table thead th {
  height: 35px;
  padding: 0 8px;
  font-weight: 600;
  line-height: 18px;
  color: var(--color-text-secondary);
  text-align: left;
  white-space: nowrap;
}

.activity-table__table tbody td {
  padding: 0 8px;
  line-height: 18px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-divider);
  vertical-align: middle;
}

.activity-table__table tbody tr:nth-child(even) {
  background-color: #fafcff;
}

.activity-table__table tbody tr:hover {
  background-color: #eff6ff;
}

.activity-table__table tbody tr:last-child td {
  border-bottom: none;
}

.activity-table__table .is-center {
  text-align: center;
}

.activity-table__table .is-end {
  text-align: right;
}

.activity-table__rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  color: #64748b;
  background-color: #eef2f7;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}

.activity-table__rank.is-top {
  color: #ffffff;
  background-color: var(--color-primary);
}

.activity-table__name {
  /* 固定行高下采用省略号，保证滚动时列对齐且不撑高 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-table__tag {
  display: inline-block;
  padding: 0 6px;
  font-size: 11px;
  line-height: 16px;
  color: #2563eb;
  background-color: #eff6ff;
  border: 1px solid #d6e4ff;
  border-radius: 4px;
  white-space: nowrap;
}

.activity-table__value {
  font-weight: 600;
  color: var(--color-text-strong);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.activity-table__value em {
  margin-left: 2px;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  color: var(--color-text-muted);
}

.activity-table__footer {
  margin: auto 0 0;
  padding-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-muted);
  text-align: right;
}

.activity-table__footer strong {
  color: var(--color-text-strong);
  font-variant-numeric: tabular-nums;
}
</style>
