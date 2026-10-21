<script setup lang="ts">
import { computed, ref } from "vue";

import ActivityTable from "@/components/dashboard/ActivityTable.vue";
import ChartCard from "@/components/dashboard/ChartCard.vue";
import DashboardHeader from "@/components/dashboard/DashboardHeader.vue";
import MasterPolarChart from "@/components/dashboard/MasterPolarChart.vue";
import PointsBarChart from "@/components/dashboard/PointsBarChart.vue";
import RegionBarChart from "@/components/dashboard/RegionBarChart.vue";
import StatGroup from "@/components/dashboard/StatGroup.vue";
import UnionRoseChart from "@/components/dashboard/UnionRoseChart.vue";
import UserTypeDonutChart from "@/components/dashboard/UserTypeDonutChart.vue";
import { dashboardMockData } from "@/data/dashboard";
import { formatThousands, sumValues } from "@/utils/format";

import type { PointsViewMode, StatCardLayout } from "@/types/dashboard";

/** 当前看板数据源（模拟数据，后续可替换为接口返回） */
const data = dashboardMockData;

/** 统计卡片布局：默认 Grid，可切换为 Flex，两种模式共享同一份数据 */
const statLayout = ref<StatCardLayout>("grid");

/** 积分发放视图模式：默认「类型视图」，可切换为「月度视图」 */
const pointsViewMode = ref<PointsViewMode>("month");

const pointsData = computed(() =>
  pointsViewMode.value === "type" ? data.points.byType : data.points.byMonth,
);

/** 派生量全部由明细求和，避免与图表数据不一致 */
const pointsTotal = computed(() => sumValues(pointsData.value));
const regionTotal = computed(() => sumValues(data.regionReads));
const userTypeTotal = computed(() => sumValues(data.userTypes));
const masterTotal = computed(() => sumValues(data.masters));
const unionTotal = computed(() => sumValues(data.unionOrgs));
const activityTotal = computed(() =>
  data.activities.reduce((total, item) => total + item.participants, 0),
);

const pointsSubtitle = computed(() =>
  pointsViewMode.value === "type"
    ? `按发放类型 · 合计 ${formatThousands(pointsTotal.value)} 积分`
    : `按月份 · 全年合计 ${formatThousands(pointsTotal.value)} 积分`,
);
</script>

<template>
  <div class="dashboard">
    <DashboardHeader
      :title="data.title"
      :description="data.description"
      :statistical-scope="data.statisticalScope"
    />

    <main class="dashboard-grid">
      <!-- 统计卡片双布局切换 -->
      <div class="dashboard-toolbar span-12">
        <span class="dashboard-toolbar__label">统计卡片布局</span>
        <div class="segmented" role="group" aria-label="统计卡片布局切换">
          <button
            type="button"
            class="segmented__button"
            :class="{ 'is-active': statLayout === 'flex' }"
            :aria-pressed="statLayout === 'flex'"
            @click="statLayout = 'flex'"
          >
            Flex 布局
          </button>
          <button
            type="button"
            class="segmented__button"
            :class="{ 'is-active': statLayout === 'grid' }"
            :aria-pressed="statLayout === 'grid'"
            @click="statLayout = 'grid'"
          >
            Grid 布局
          </button>
        </div>
      </div>

      <!-- 第一行：思想引领 / 就业概况 -->
      <StatGroup class="span-6" :data="data.ideology" :layout="statLayout" />
      <StatGroup class="span-6" :data="data.employment" :layout="statLayout" />

      <!-- 第二行：阅读用户地区分布 / 工会活动 / 用户类型 -->
      <ChartCard
        class="span-4"
        title="阅读用户地区分布"
        :subtitle="`单位：人 · 合计 ${formatThousands(regionTotal)} 人`"
      >
        <RegionBarChart :data="data.regionReads" />
      </ChartCard>

      <ChartCard
        class="span-4"
        title="工会活动"
        :subtitle="`按参与人次排名 · 累计 ${formatThousands(activityTotal)} 人次`"
      >
        <ActivityTable :data="data.activities" />
      </ChartCard>

      <ChartCard
        class="span-4"
        title="用户类型"
        :subtitle="`单位：人 · 共 ${formatThousands(userTypeTotal)} 人`"
      >
        <UserTypeDonutChart :data="data.userTypes" />
      </ChartCard>

      <!-- 第三行：劳模工匠 / 工会组织 / 积分发放 -->
      <ChartCard
        class="span-4"
        title="劳模工匠"
        :subtitle="`单位：人 · 共 ${formatThousands(masterTotal)} 人`"
      >
        <MasterPolarChart :data="data.masters" />
      </ChartCard>

      <ChartCard
        class="span-4"
        title="工会组织"
        :subtitle="`单位：家 · 共 ${formatThousands(unionTotal)} 家`"
      >
        <UnionRoseChart :data="data.unionOrgs" />
      </ChartCard>

      <ChartCard class="span-4" title="积分发放" :subtitle="pointsSubtitle">
        <template #actions>
          <div class="segmented" role="group" aria-label="积分发放视图切换">
            <button
              type="button"
              class="segmented__button"
              :class="{ 'is-active': pointsViewMode === 'type' }"
              :aria-pressed="pointsViewMode === 'type'"
              @click="pointsViewMode = 'type'"
            >
              类型视图
            </button>
            <button
              type="button"
              class="segmented__button"
              :class="{ 'is-active': pointsViewMode === 'month' }"
              :aria-pressed="pointsViewMode === 'month'"
              @click="pointsViewMode = 'month'"
            >
              月度视图
            </button>
          </div>
        </template>

        <PointsBarChart :data="pointsData" :view-mode="pointsViewMode" />
      </ChartCard>
    </main>

    <footer class="dashboard-footer">
      <p>
        说明：本页面数据均为「演示模拟数据」，不代表真实工会业务统计结果；图表与合计值均由同一份明细数据计算得出。
      </p>
    </footer>
  </div>
</template>
