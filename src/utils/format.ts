/**
 * 数值格式化工具。
 */

/** 千分位格式化整数，例如 486320 -> 486,320 */
export function formatThousands(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return Math.round(value).toLocaleString('zh-CN')
}

/** 计算占比（保留 1 位小数），返回形如 "36.2" 的字符串 */
export function formatShare(value: number, total: number, digits = 1): string {
  if (total <= 0) return (0).toFixed(digits)
  return ((value / total) * 100).toFixed(digits)
}

/** 求和工具，用于根据明细数据推导合计值，保证总量与明细一致 */
export function sumValues(items: ReadonlyArray<{ value: number }>): number {
  return items.reduce((total, item) => total + item.value, 0)
}
