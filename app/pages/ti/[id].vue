<template>
  <div>
    <TiHero :t="detail!" />

    <div class="mx-auto max-w-shell px-3 py-5 sm:px-4 sm:py-6 lg:py-8">
      <div class="grid min-w-0 gap-5 lg:grid-cols-3 lg:gap-6">
        <!-- 主内容 -->
        <div class="order-2 min-w-0 space-y-5 lg:order-none lg:col-span-2">
          <!-- 赛事简介 -->
          <section v-reveal class="reveal card p-4 sm:p-5 lg:p-6">
            <h2 class="mb-2 text-base font-bold text-ink-main lg:text-lg">赛事简介</h2>
            <p class="max-w-prose text-sm leading-relaxed text-ink-muted lg:text-base lg:leading-8">{{ detail?.summaryZh }}</p>
          </section>

          <!-- 中国战队表现 -->
          <TiChinaPerformance v-if="china" v-reveal :style="{ '--i': 1 }" :perf="china" />

          <!-- 最终排名（含全部队伍 + 赛区 + 出线方式） -->
          <TiPlacementTable v-reveal :style="{ '--i': 2 }" :placements="detail?.placements || []" :status="detail?.status" />

          <!-- 参赛阵容 -->
          <TiRosterTable
            v-if="detail?.rosters?.length"
            v-reveal
            :style="{ '--i': 3 }"
            :rosters="detail.rosters"
            :status="detail.status"
          />
        </div>

        <!-- 侧栏：基础信息 -->
        <div class="order-1 min-w-0 lg:order-none lg:col-span-1 lg:row-start-1">
          <TiInfoPanel v-reveal :t="detail!" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)

const { data: detail } = await useTournament(id)
if (!detail.value) {
  throw createError({ statusCode: 404, statusMessage: '未找到该届 ti', fatal: true })
}

const { data: china } = await useChinaPerformance(detail.value.id)

useHead({
  title:
    detail.value.status === 'cancelled'
      ? `${detail.value.year} 赛事取消 — Ti百科`
      : `Ti${detail.value.tiNo} · ${detail.value.nameZh} — Ti百科`,
  meta: [{ name: 'description', content: detail.value.summaryZh }],
})
</script>
