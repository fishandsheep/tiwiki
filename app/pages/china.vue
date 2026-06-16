<template>
  <div class="mx-auto max-w-shell px-4 py-8">
    <header v-reveal class="reveal mb-6">
      <span class="chip chip-red">🇨🇳 中国战队专题</span>
      <h1 class="mt-3 text-2xl font-black text-ink-main sm:text-3xl">中国战队的 Ti征程</h1>
      <p class="mt-1 max-w-2xl text-sm text-ink-muted">
        中国 Dota 在 Ti赛场屡创辉煌。以下为各届中国战队的最佳成绩。
      </p>
    </header>

    <!-- 中国冠军高光 -->
    <section v-if="champions.length" class="mb-8">
      <SectionTitle title="中国冠军" />
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="(c, i) in champions"
          :key="c.tiNo"
          v-reveal
          :style="{ '--i': i }"
          :to="`/ti/${c.routeId}`"
          class="card card-hover reveal border-gold/40 bg-gold/5 p-5"
        >
          <span class="ti-wordmark text-3xl">{{ formatTiLabel(c.tiNo) }}</span>
          <p class="mt-2 text-xs text-ink-muted">{{ c.year }}</p>
          <p class="mt-1 text-lg font-black text-ink-main">{{ c.bestTeamName }}</p>
          <p class="mt-2 text-sm text-gold/80">🇨🇳 夺得冠军</p>
        </NuxtLink>
      </div>
    </section>

    <!-- 历届中国最佳 -->
    <section v-reveal class="reveal">
      <SectionTitle title="历届中国战队最佳成绩" />
      <div class="card divide-y divide-edge">
        <NuxtLink
          v-for="c in orderedByTi"
          :key="c.tiNo"
          :to="`/ti/${c.routeId}`"
          class="grid min-w-0 grid-cols-[3.75rem_1fr] gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-bg-subtle sm:flex sm:items-center sm:gap-4"
        >
          <span class="font-black sm:w-16" :class="c.bestRank === 1 ? 'text-gold' : 'text-ink-main'">{{ formatTiLabel(c.tiNo) }}</span>
          <span class="min-w-0 truncate text-sm font-medium text-ink-main sm:flex-1">{{ c.bestTeamName }}</span>
          <span class="text-xs text-ink-muted sm:w-14">{{ c.year }}</span>
          <span class="chip justify-self-start" :class="chipClass(c.bestRank)">{{ c.bestPlacement }}</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatTiLabel } from '~/composables/tiData'
const { data: rankings } = await useRankings()

// 中国页按时间倒序展示
const orderedByTi = computed(() =>
  [...rankings.value.chinaTeams].sort((a, b) => b.tiNo - a.tiNo),
)
const champions = computed(() => rankings.value.chinaTeams.filter((c) => c.bestRank === 1))

function chipClass(rank: number) {
  if (rank === 1) return 'chip-gold'
  if (rank === 2) return 'chip-red'
  return ''
}

useHead({ title: '中国战队 — Ti百科' })
</script>
