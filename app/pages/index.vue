<template>
  <div>
    <!-- Hero -->
    <section v-reveal class="reveal relative overflow-hidden border-b border-edge">
      <div class="ti-hero-glow pointer-events-none absolute inset-0" />
      <div class="pointer-events-none absolute -right-16 top-1/2 hidden h-[360px] w-[280px] -translate-y-1/2 rotate-[12deg] opacity-30 blur-[0.5px] sm:block lg:h-[440px] lg:w-[340px]">
        <div class="aegis-mark h-full w-full" />
      </div>
      <div class="relative mx-auto max-w-shell px-4 py-12 sm:py-16">
        <span class="chip chip-gold">Dota2 · The International</span>
        <h1 class="mt-4 text-3xl font-black leading-tight text-ink-main sm:text-5xl">
          <span class="ti-wordmark text-4xl sm:text-6xl">ti</span> 百科
        </h1>
        <p class="mt-3 max-w-2xl text-sm text-ink-muted sm:text-base">
          Dota2 国际邀请赛中文资料库。收录 ti 1 到 ti 14（截至 2025）与 2020 取消条目，覆盖冠军、奖金池、参赛队伍、最终排名与中国战队表现。
        </p>
        <div class="mt-4 max-w-2xl">
          <h2 class="text-sm font-bold text-ink-main sm:text-base">什么是 ti</h2>
          <div class="mt-2 space-y-2 text-sm leading-relaxed text-ink-muted">
            <p>The International（简称 ti）是 Valve 主办的 Dota 2 世界最高规格赛事，自 2011 年起举办。</p>
            <p>每届 ti 都记录版本演进、地区格局与冠军阵容，是职业 Dota 最具代表性的年度舞台。</p>
          </div>
        </div>
        <div class="mt-6 flex flex-wrap gap-3">
          <NuxtLink to="/ti" class="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-bg-main transition-opacity hover:opacity-90">
            浏览历届赛事 →
          </NuxtLink>
          <NuxtLink to="/china" class="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-ink-main transition-colors hover:border-gold/60">
            中国战队表现
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 数据概览 -->
    <section class="mx-auto max-w-shell px-4 py-8">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard v-for="(s, i) in statsCards" :key="s.label" v-reveal :style="{ '--i': i }" v-bind="s" />
      </div>
    </section>

    <!-- 核心入口 -->
    <section class="mx-auto max-w-shell px-4 pb-2">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <QuickEntry v-for="(e, i) in entries" :key="e.to" v-reveal :style="{ '--i': i }" v-bind="e" />
      </div>
    </section>

    <!-- 历届赛事 -->
    <section class="mx-auto max-w-shell px-4 py-8">
      <SectionTitle title="历届赛事" to="/ti" />
      <!-- 最新届:大卡破网格,建立层级 -->
      <TiFeatureCard
        v-if="featured"
        v-reveal
        :tournament="featured"
      />
      <!-- 其余届:网格 -->
      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TiCard
          v-for="(t, i) in rest"
          :key="t.id"
          v-reveal
          :style="{ '--i': Math.min(i, 6) }"
          :tournament="t"
          :best-china-rank="t.bestChinaRank"
        />
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { formatUsd } from '~/composables/tiData'

const { data: tournaments } = await useTournaments()
const { data: stats } = await useStats()

// 最新届置顶放大(featured),其余走网格 —— 破均匀网格、建立层级
const featured = computed(() => tournaments.value[0] ?? null)
const rest = computed(() => tournaments.value.slice(1))

const statsCards = computed(() => [
  { label: '收录届数', value: String(stats.value.totalTIs) },
  { label: '中国冠军', value: String(stats.value.chinaChampionsCount), suffix: '次' },
  { label: '最高奖金池', value: formatUsd(stats.value.maxPrizePool), sub: 'ti ' + stats.value.maxPrizeTiNo },
])

const entries = [
  { to: '/ti', label: '历届赛事', icon: 'trophy', desc: 'ti 1 到 ti 14 与 2020' },
  { to: '/china', label: '中国战队', icon: 'pin', desc: '中国战队成绩' },
  { to: '/rankings', label: '榜单', icon: 'chart', desc: '奖金池 / 冠军选手' },
]
</script>
