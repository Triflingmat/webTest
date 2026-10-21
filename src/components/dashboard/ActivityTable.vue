<script setup lang="ts">
import { computed } from 'vue'

import { formatThousands } from '@/utils/format'

import type { ActivityRow } from '@/types/dashboard'

interface Props {
  /** 工会活动列表（按排名升序） */
  data: ActivityRow[]
}

const props = defineProps<Props>()

const rows = computed(() => props.data)

/** 表尾合计，由明细求和得出 */
const totalParticipants = computed(() =>
  props.data.reduce((total, item) => total + item.participants, 0)
)
</script>

<template>
  <div class="activity-table">
    <div class="activity-table__scroll">
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
        <tbody>
          <tr v-for="row in rows" :key="row.rank">
            <td class="is-center">
              <span class="activity-table__rank" :class="{ 'is-top': row.rank <= 3 }">{{ row.rank }}</span>
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

.activity-table__scroll {
  flex: 1 1 auto;
  min-height: 0;
  /* 可容纳约 11 行（当前 10 条模拟数据全部可见）；后续数据增多时该区域独立滚动 */
  max-height: 420px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
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
  position: sticky;
  top: 0;
  z-index: 1;
  height: 35px;
  padding: 0 8px;
  font-weight: 600;
  line-height: 18px;
  color: var(--color-text-secondary);
  text-align: left;
  white-space: nowrap;
  background-color: #f1f5fb;
  border-bottom: 1px solid var(--color-border);
}

.activity-table__table tbody td {
  height: 35px;
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
  /* 名称过长时换行显示，不遮挡其他列 */
  overflow-wrap: anywhere;
}

.activity-table__tag {
  display: inline-block;
  padding: 0 6px;
  font-size: 11px;
  line-height: 16px;
  color: #2563eb;
  white-space: nowrap;
  background-color: #eff6ff;
  border: 1px solid #d6e4ff;
  border-radius: 4px;
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
