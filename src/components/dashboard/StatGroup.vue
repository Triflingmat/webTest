<script setup lang="ts">
import { formatThousands } from '@/utils/format'

import type { StatGroupData } from '@/types/dashboard'

interface Props {
  /** 指标组数据 */
  data: StatGroupData
}

defineProps<Props>()

/** 图标容器的浅色背景，沿用原卡片的四色辅助色系 */
const ACCENT_TINTS: string[] = ['#eff6ff', '#f0f9ff', '#f0fdfa', '#fffbeb']
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
        :style="{ '--stat-tint': ACCENT_TINTS[index % ACCENT_TINTS.length] }"
      >
        <div v-if="item.icon" class="stat-card__icon-box">
          <img class="stat-card__icon" :src="item.icon" alt="" width="34" height="34" decoding="async" />
        </div>
        <div class="stat-card__content">
          <p class="stat-card__label">{{ item.label }}</p>
          <p class="stat-card__value">
            <span class="stat-card__number">{{ formatThousands(item.value) }}</span>
            <span class="stat-card__unit">{{ item.unit }}</span>
          </p>
        </div>
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 14px 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03), 0 10px 24px -20px rgba(15, 23, 42, 0.28);
}

.stat-card__icon-box {
  display: flex;
  flex: 0 0 52px;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background-color: var(--stat-tint);
  border-radius: 14px;
}

.stat-card__icon {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.stat-card__content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-card__label {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: var(--color-text-muted);
  /* 允许换行但不截断，保证指标名称完整显示 */
  overflow-wrap: anywhere;
}

.stat-card__value {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.stat-card__number {
  font-size: clamp(24px, 1.9vw, 28px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--color-text-strong);
  /* 常规数值保持单行；异常长的数值允许换行兜底，避免撑破卡片 */
  overflow-wrap: anywhere;
}

.stat-card__unit {
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .stat-group__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
