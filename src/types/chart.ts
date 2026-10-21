/**
 * 图表通用类型定义。
 */

/** 自定义图例项：颜色由图表组件按统一色板生成，保证与图形颜色一致 */
export interface ChartLegendItem {
  /** 类别名称 */
  name: string
  /** 数量 */
  value: number
  /** 与图形一致的颜色 */
  color: string
  /** 与图形一致的渐变（可选，优先于纯色展示） */
  gradient?: string
  /** 占比（已格式化，例如 "36.2"），不传则不展示 */
  share?: string
}
