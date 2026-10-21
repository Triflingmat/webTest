<script setup lang="ts">
interface Props {
  /** 模块标题 */
  title: string
  /** 模块副标题 / 统计口径提示 */
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  subtitle: ''
})
</script>

<template>
  <section class="chart-card">
    <header class="chart-card__header">
      <div class="chart-card__heading">
        <h2 class="chart-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="chart-card__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="chart-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="chart-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.chart-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 18px 14px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.chart-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--color-divider);
}

.chart-card__heading {
  min-width: 0;
}

.chart-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  color: var(--color-text-strong);
}

.chart-card__title::before {
  content: '';
  flex: none;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background-color: var(--color-primary);
}

.chart-card__subtitle {
  margin: 2px 0 0 11px;
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-muted);
}

.chart-card__actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chart-card__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}
</style>
