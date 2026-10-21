<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** 页面标题 */
  title: string
  /** 页面说明 */
  description: string
  /** 统计口径提示 */
  statisticalScope: string
  /** 数据更新标识（展示用文案） */
  updatedAt?: string
}

const props = withDefaults(defineProps<Props>(), {
  updatedAt: ''
})

/** 右上角展示的更新时间，仅用于提示「这是演示数据」 */
const updateText = computed(() => props.updatedAt || '更新于 2024-12-31（演示）')
</script>

<template>
  <header class="dashboard-header">
    <div class="dashboard-header__main">
      <h1 class="dashboard-header__title">{{ title }}</h1>
      <p class="dashboard-header__description">{{ description }}</p>
    </div>

    <div class="dashboard-header__meta">
      <span class="dashboard-header__badge">模拟数据</span>
      <div class="dashboard-header__meta-text">
        <p class="dashboard-header__scope">{{ statisticalScope }}</p>
        <p class="dashboard-header__updated">{{ updateText }}</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dashboard-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.dashboard-header__main {
  min-width: 0;
}

.dashboard-header__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 30px;
  letter-spacing: 0.01em;
  color: var(--color-text-strong);
}

.dashboard-header__description {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--color-text-secondary);
}

.dashboard-header__meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dashboard-header__badge {
  flex: none;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  color: #96560a;
  background-color: #fef3c7;
  border: 1px solid #fcd77f;
  border-radius: 999px;
  white-space: nowrap;
}

.dashboard-header__meta-text {
  text-align: right;
}

.dashboard-header__scope {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.dashboard-header__updated {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .dashboard-header {
    align-items: flex-start;
  }

  .dashboard-header__meta-text {
    text-align: left;
  }
}
</style>
