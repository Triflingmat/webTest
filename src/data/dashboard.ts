/**
 * 看板模拟数据。
 *
 * ⚠️ 重要说明：
 * 1. 本文件全部为「模拟数据」（mock data），仅用于页面演示与交互验证，
 *    不代表任何真实工会业务统计结果，请勿作为决策依据。
 * 2. 数据结构与 src/types/dashboard.ts 中的类型一一对应，后续接入后端时
 *    只需把这里的导出替换为接口请求结果即可，视图层无需改动。
 * 3. 所有派生量（合计、占比、总计）均由明细数据计算得出，不额外维护固定值，
 *    确保图表、图例、提示框与中心文案中的数字始终一致。
 */

import type { DashboardData } from '@/types/dashboard'

/** 看板全部模块的模拟数据 */
export const dashboardMockData: DashboardData = {
  title: '工会综合数据看板',
  description: '汇总思想引领、就业服务、组织建设与职工服务等工会业务关键指标。',
  statisticalScope: '统计口径：2024 年度累计 · 演示模拟数据',

  /* ============ 模块 1-1：思想引领 ============ */
  ideology: {
    title: '思想引领',
    description: '文章、阅读与互动的年度累计数据',
    items: [
      {
        key: 'articlePublished',
        label: '文章发布数',
        value: 1286,
        unit: '篇',
        icon: '/assets/1/发布计划.png'
      },
      {
        key: 'articleReads',
        label: '阅读量',
        value: 486320,
        unit: '次',
        icon: '/assets/1/阅读记录.png'
      },
      {
        key: 'articleAdopted',
        label: '文章采纳数',
        value: 342,
        unit: '篇',
        icon: '/assets/1/采纳.png'
      },
      {
        key: 'articleLikes',
        label: '点赞量',
        value: 52680,
        unit: '次',
        icon: '/assets/1/点赞.png'
      }
    ]
  },

  /* ============ 模块 1-2：就业概况 ============ */
  employment: {
    title: '就业概况',
    description: '岗位、求职与就业服务年度累计数据',
    items: [
      {
        key: 'jobPublished',
        label: '发布岗位',
        value: 1842,
        unit: '个',
        icon: '/assets/1/岗位组.png'
      },
      {
        key: 'jobSeekers',
        label: '求职人数',
        value: 9635,
        unit: '人',
        icon: '/assets/1/求职简历.png'
      },
      {
        key: 'employmentPromoted',
        label: '促进就业',
        value: 2476,
        unit: '人',
        icon: '/assets/1/就业.png'
      },
      {
        key: 'recruitEvents',
        label: '招聘活动',
        value: 128,
        unit: '场',
        icon: '/assets/1/人员招聘.png'
      }
    ]
  },

  /* ============ 模块 2：阅读用户地区分布（5 条，3 条可视） ============ */
  regionReads: [
    { name: '城东区', value: 12480 },
    { name: '城西区', value: 10860 },
    { name: '城南区', value: 9630 },
    { name: '城北区', value: 8720 },
    { name: '高新区', value: 7840 }
  ],

  /* ============ 模块 3：工会活动（7 条，4 行可视） ============ */
  activities: [
    { rank: 1, name: '职工读书分享会', category: '文化体育', participants: 1260 },
    { rank: 2, name: '春季职工篮球联赛', category: '文化体育', participants: 1180 },
    { rank: 3, name: '劳模工匠宣讲进企业', category: '思想引领', participants: 960 },
    { rank: 4, name: '职工技能比武大赛', category: '技能竞赛', participants: 875 },
    { rank: 5, name: '女职工健康知识讲座', category: '关爱服务', participants: 742 },
    { rank: 6, name: '送文艺下基层演出', category: '文化体育', participants: 690 },
    { rank: 7, name: '职工心理健康沙龙', category: '关爱服务', participants: 615 }
  ],

  /* ============ 模块 4：用户类型 ============ */
  userTypes: [
    { name: '企业职工', value: 5820 },
    { name: '机关事业单位职工', value: 3260 },
    { name: '新就业形态劳动者', value: 1840 },
    { name: '农民工', value: 960 },
    { name: '其他', value: 230 }
  ],

  /* ============ 模块 5：劳模工匠 ============ */
  masters: [
    { level: '县级', value: 128 },
    { level: '市级', value: 86 },
    { level: '省级', value: 34 },
    { level: '国家级', value: 12 }
  ],

  /* ============ 模块 6：工会组织 ============ */
  unionOrgs: [
    { name: '村社工会', value: 246 },
    { name: '其他', value: 138 },
    { name: '企业', value: 512 },
    { name: '事业单位', value: 174 }
  ],

  /* ============ 模块 7：积分发放 ============ */
  points: {
    // 类型视图：按积分发放类型汇总（年度累计）
    byType: [
      { name: '学习培训', value: 18650 },
      { name: '志愿服务', value: 12480 },
      { name: '技能竞赛', value: 9630 },
      { name: '建言献策', value: 7240 },
      { name: '帮扶互助', value: 5860 },
      { name: '文体活动', value: 4320 }
    ],
    // 月度视图：按月份汇总。为演示「同一口径不同视角」的聚合关系，
    // 该组月度数据之和与类型视图合计相等（均为 58,180 积分）。
    byMonth: [
      { name: '1月', value: 3980 },
      { name: '2月', value: 3120 },
      { name: '3月', value: 4260 },
      { name: '4月', value: 4480 },
      { name: '5月', value: 5120 },
      { name: '6月', value: 5360 },
      { name: '7月', value: 5240 },
      { name: '8月', value: 4960 },
      { name: '9月', value: 5620 },
      { name: '10月', value: 5480 },
      { name: '11月', value: 5320 },
      { name: '12月', value: 5240 }
    ]
  }
}
