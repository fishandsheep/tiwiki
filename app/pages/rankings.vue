<template>
  <div class="mx-auto max-w-shell px-4 py-8">
    <header v-reveal class="reveal mb-6">
      <h1 class="text-2xl font-black text-ink-main sm:text-3xl">榜单</h1>
      <p class="mt-1 text-sm text-ink-muted">奖金池与 ti 冠军选手总览</p>
    </header>

    <div class="space-y-8">
      <!-- 奖金池趋势 -->
      <PrizePoolTrend :prize-pools="rankings.prizePools" />

      <!-- 奖金池榜 -->
      <section v-reveal class="reveal">
        <SectionTitle title="奖金池榜" />
        <PrizePoolRanking :prize-pools="rankings.prizePools" />
      </section>

      <section v-reveal class="reveal">
        <SectionTitle title="选手冠军榜" />
        <PlayerChampionRanking :players="rankings.playerChampions" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: rankings } = await useRankings()
useHead({ title: '榜单 — ti 百科' })
</script>
