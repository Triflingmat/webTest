<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { ANIMATION_DURATION, ANIMATIONS_ENABLED } from '@/config/animation'
import { formatThousands } from '@/utils/format'

interface Props {
  /** 目标数值 */
  value: number
}

const props = defineProps<Props>()

const displayValue = ref(ANIMATIONS_ENABLED ? 0 : props.value)
let animationFrame = 0
let startTime = 0
let startValue = 0
let targetValue = props.value

function stopAnimation(): void {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }
}

/** 从当前显示值连续增长到新目标值，布局切换不会重新触发 */
function animateTo(nextValue: number): void {
  stopAnimation()
  targetValue = nextValue

  if (!ANIMATIONS_ENABLED) {
    displayValue.value = nextValue
    return
  }

  startValue = displayValue.value
  startTime = performance.now()

  const tick = (now: number): void => {
    const progress = Math.min((now - startTime) / ANIMATION_DURATION, 1)
    // easeOutCubic：起步明显、收尾平滑，与 ECharts 默认缓动接近
    const eased = 1 - (1 - progress) ** 3
    displayValue.value = Math.round(startValue + (targetValue - startValue) * eased)

    if (progress < 1) {
      animationFrame = window.requestAnimationFrame(tick)
    } else {
      animationFrame = 0
    }
  }

  animationFrame = window.requestAnimationFrame(tick)
}

onMounted(() => {
  animateTo(props.value)
})

watch(
  () => props.value,
  (nextValue) => {
    if (nextValue !== targetValue) animateTo(nextValue)
  }
)

onBeforeUnmount(stopAnimation)
</script>

<template>
  <span>{{ formatThousands(displayValue) }}</span>
</template>
