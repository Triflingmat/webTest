/**
 * 统一的图表配色与视觉常量。
 *
 * 所有图表组件的颜色都从这里取，确保「图例颜色 = 图形颜色」的一致性，
 * 避免在各组件中重复硬编码色值。
 */

/** 主色（政务蓝） */
export const PRIMARY_COLOR = '#2563eb'

/** 页面级通用系列色板 */
export const SERIES_PALETTE: string[] = [
  '#2563eb',
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#22c55e',
  '#64748b'
]

/**
 * 地区阅读人数横向柱状图配色：按排名从深到浅的蓝色渐变阶梯，
 * 颜色只表达排名层次，柱体长度始终由真实数值决定。
 */
export const REGION_BAR_COLORS: string[] = [
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#7dabfb',
  '#95bcfc',
  '#aacdfd',
  '#c7dbfe'
]

/** 用户类型环形图配色 */
export const USER_TYPE_COLORS: string[] = ['#2563eb', '#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6']

/** 劳模工匠极坐标圆角柱状图配色（与图例一一对应） */
export const MASTER_LEVEL_COLORS: string[] = ['#60a5fa', '#2563eb', '#14b8a6', '#f59e0b']

/** 工会组织玫瑰图配色 */
export const UNION_ORG_COLORS: string[] = ['#2563eb', '#0ea5e9', '#f59e0b', '#8b5cf6']

/** 通用图表文本与网格色（文本色保证在白色卡片上的可读对比度） */
export const CHART_TEXT_COLOR = '#475569'
export const CHART_TEXT_MUTED_COLOR = '#64748b'
export const CHART_AXIS_LINE_COLOR = '#e2e8f0'
export const CHART_SPLIT_LINE_COLOR = '#eef2f7'
