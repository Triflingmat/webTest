/**
 * 全站统一动画与轮播配置。
 *
 * 统计数字增长、图表首次入场、地区/活动/月度滚动都从这里取时长，
 * 避免各组件出现不一致的时间参数。
 */

/** 入场动画与单次滚动过渡的统一时长（ms） */
export const ANIMATION_DURATION = 3000

/** 自动轮播的推进间隔（ms） */
export const CAROUSEL_INTERVAL = 3000

/** 页面初始化后首次轮播的延迟：先完成 3 秒入场，再开始第一次滚动 */
export const FIRST_CAROUSEL_DELAY = ANIMATION_DURATION

/** 动画总开关；关闭后数字直接显示目标值，图表使用极短动画 */
export const ANIMATIONS_ENABLED = true

/** CSS 滚动过渡使用的缓动曲线 */
export const CAROUSEL_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

/** ECharts 图表入场/更新的统一动画配置 */
export const CHART_ANIMATION = {
  animation: ANIMATIONS_ENABLED,
  animationDuration: ANIMATIONS_ENABLED ? ANIMATION_DURATION : 0,
  animationDurationUpdate: ANIMATIONS_ENABLED ? ANIMATION_DURATION : 0,
  animationEasing: 'cubicOut',
  animationEasingUpdate: 'cubicOut'
} as const
