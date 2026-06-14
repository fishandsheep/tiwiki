<template>
  <div>
    <TiHero :t="detail!" />

    <div class="mx-auto max-w-shell px-4 py-6">
      <div class="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <!-- 主内容 -->
        <div class="space-y-5 lg:col-span-2">
          <!-- 赛事简介 -->
          <section v-reveal class="reveal card p-5">
            <h2 class="mb-2 text-base font-bold text-ink-main">赛事简介</h2>
            <p class="text-sm leading-relaxed text-ink-muted">{{ detail?.summaryZh }}</p>
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
        <div class="lg:col-span-1">
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
      ? `${detail.value.year} 赛事取消 — ti 百科`
      : `ti ${detail.value.tiNo} · ${detail.value.nameZh} — ti 百科`,
  meta: [{ name: 'description', content: detail.value.summaryZh }],
})
</script>
