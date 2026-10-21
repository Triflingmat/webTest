/**
 * 看板数据结构类型定义。
 *
 * 说明：当前阶段所有业务数据均为「模拟数据」（见 src/data/dashboard.ts），
 * 类型定义按照后端接口未来可能返回的字段形状设计，便于后续用 API 数据替换模拟数据。
 */

/** 统计卡片指标 */
export interface StatCardItem {
  /** 指标唯一标识，可作为后续接口字段名 */
  key: string
  /** 指标名称 */
  label: string
  /** 指标数值（整数） */
  value: number
  /** 单位，例如「篇」「次」「人」 */
  unit: string
  /** 指标图标（public 目录下的静态资源路径，可选） */
  icon?: string
}

/** 一组统计卡片（思想引领 / 就业概况） */
export interface StatGroupData {
  /** 组标题 */
  title: string
  /** 组说明，例如统计口径提示 */
  description: string
  /** 组内指标，固定 4 项 */
  items: StatCardItem[]
}

/** 阅读用户地区分布：横向柱状图数据项 */
export interface RegionReadItem {
  /** 地区名称 */
  name: string
  /** 阅读用户数（人） */
  value: number
}

/** 工会活动表格行 */
export interface ActivityRow {
  /** 排名 */
  rank: number
  /** 活动名称 */
  name: string
  /** 活动分类 */
  category: string
  /** 参与人次 */
  participants: number
}

/** 扇形/环形类图表数据项（用户类型、工会组织） */
export interface CategoryShareItem {
  /** 类别名称 */
  name: string
  /** 数量 */
  value: number
}

/** 劳模工匠级别 */
export type MasterLevel = '县级' | '市级' | '省级' | '国家级'

/** 劳模工匠数据项 */
export interface MasterLevelItem {
  /** 级别 */
  level: MasterLevel
  /** 人数 */
  value: number
}

/** 积分发放视图模式 */
export type PointsViewMode = 'type' | 'month'

/** 积分发放数据项（按类型或按月，结构一致） */
export interface PointsItem {
  /** 横轴类目名称 */
  name: string
  /** 积分数量 */
  value: number
}

/** 积分发放完整数据（类型视图 + 月度视图） */
export interface PointsDataset {
  /** 按发放类型汇总（类型视图） */
  byType: PointsItem[]
  /** 按月份汇总（月度视图，模拟数据） */
  byMonth: PointsItem[]
}

/** 看板整体数据集合 */
export interface DashboardData {
  /** 页面标题 */
  title: string
  /** 页面说明 */
  description: string
  /** 统计口径提示 */
  statisticalScope: string
  /** 思想引领指标组 */
  ideology: StatGroupData
  /** 就业概况指标组 */
  employment: StatGroupData
  /** 阅读用户地区分布 */
  regionReads: RegionReadItem[]
  /** 工会活动列表 */
  activities: ActivityRow[]
  /** 用户类型分布 */
  userTypes: CategoryShareItem[]
  /** 劳模工匠级别分布 */
  masters: MasterLevelItem[]
  /** 工会组织类型分布 */
  unionOrgs: CategoryShareItem[]
  /** 积分发放数据 */
  points: PointsDataset
}
