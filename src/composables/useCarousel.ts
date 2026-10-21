import { onBeforeUnmount, onMounted } from 'vue'

import { CAROUSEL_INTERVAL, FIRST_CAROUSEL_DELAY } from '@/config/animation'

interface CarouselOptions {
  /** 是否在组件挂载后自动开始 */
  autoStart?: boolean
  /** 首次推进延迟，默认先等待入场动画结束 */
  firstDelay?: number
}

/**
 * 统一的轮播计时器。
 *
 * - 首次推进在 `firstDelay` 后发生，后续按 `CAROUSEL_INTERVAL` 重复；
 * - 重复调用 start 不会创建第二个定时器；
 * - 组件卸载时自动清理，避免遗留任务。
 */
export function useCarousel(onTick: () => void, options: CarouselOptions = {}) {
  const { autoStart = true, firstDelay = FIRST_CAROUSEL_DELAY } = options

  let firstTimer: ReturnType<typeof setTimeout> | null = null
  let repeatTimer: ReturnType<typeof setInterval> | null = null
  let running = false

  function clearTimers(): void {
    if (firstTimer !== null) {
      clearTimeout(firstTimer)
      firstTimer = null
    }
    if (repeatTimer !== null) {
      clearInterval(repeatTimer)
      repeatTimer = null
    }
  }

  function stop(): void {
    clearTimers()
    running = false
  }

  function start(): void {
    if (running) return
    clearTimers()
    running = true
    firstTimer = setTimeout(() => {
      firstTimer = null
      onTick()
      repeatTimer = setInterval(onTick, CAROUSEL_INTERVAL)
    }, firstDelay)
  }

  onMounted(() => {
    if (autoStart) start()
  })

  onBeforeUnmount(stop)

  return { start, stop }
}
