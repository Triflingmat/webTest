<script setup lang="ts">
import { formatThousands } from '@/utils/format'

import type { StatGroupData } from '@/types/dashboard'

interface Props {
  /** 指标组数据 */
  data: StatGroupData
}

defineProps<Props>()

/** 每组指标的辅助色，按顺序取用，保持整体协调 */
const ACCENT_COLORS: string[] = ['#2563eb', '#0ea5e9', '#14b8a6', '#f59e0b']
</script>

<template>
  <section class="stat-group">
    <header class="stat-group__header">
      <div class="stat-group__heading">
        <h2 class="stat-group__title">{{ data.title }}</h2>
        <p class="stat-group__description">{{ data.description }}</p>
      </div>
    </header>

    <div class="stat-group__grid">
      <article
        v-for="(item, index) in data.items"
        :key="item.key"
        class="stat-card"
        :style="{ '--stat-accent': ACCENT_COLORS[index % ACCENT_COLORS.length] }"
      >
        <p class="stat-card__label">{{ item.label }}</p>
        <p class="stat-card__value">
          <span class="stat-card__number">{{ formatThousands(item.value) }}</span>
          <span class="stat-card__unit">{{ item.unit }}</span>
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.stat-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 18px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.stat-group__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--color-divider);
}

.stat-group__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  color: var(--color-text-strong);
}

.stat-group__title::before {
  content: '';
  flex: none;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background-color: var(--color-primary);
}

.stat-group__description {
  margin: 2px 0 0 11px;
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-muted);
}

.stat-group__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  border-left: 3px solid var(--stat-accent);
}

.stat-card__label {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-secondary);
  /* 允许换行但不截断，保证指标名称完整显示 */
  overflow-wrap: anywhere;
}

.stat-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.stat-card__number {
  font-size: 24px;
  font-weight: 700;
  line-height: 30px;
  letter-spacing: -0.02em;
  color: var(--color-text-strong);
}

.stat-card__unit {
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-muted);
}

@media (max-width: 1200px) {
  .stat-group__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
