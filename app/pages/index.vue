<template>
  <div>
    <!-- Hero -->
    <section
      v-reveal
      class="reveal ti-hero relative overflow-hidden border-b border-edge"
      @pointermove="handleHeroPointerMove"
      @pointerleave="resetHeroPointer"
    >
      <div
        class="ti-hero-glow pointer-events-none absolute inset-0"
        :style="heroAegisStyle"
      >
        <div class="hero-aegis-orbit absolute right-[-3.5rem] top-1/2 hidden h-[390px] w-[300px] -translate-y-1/2 sm:block lg:right-6 lg:h-[500px] lg:w-[390px]">
          <div class="hero-aegis-aura absolute inset-[-18%]" />
          <div class="aegis-mark hero-aegis h-full w-full" />
        </div>
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
          <NuxtLink to="/ti" class="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-bg-main shadow-[0_0_26px_rgb(var(--gold)/0.24)] transition-opacity hover:opacity-90">
            浏览历届赛事 →
          </NuxtLink>
          <NuxtLink to="/china" class="rounded-lg border border-edge bg-bg-card/45 px-4 py-2 text-sm font-medium text-ink-main transition-colors hover:border-gold/60">
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

const heroPointer = reactive({ x: 0, y: 0 })

const heroAegisStyle = computed(() => ({
  '--aegis-x': `${heroPointer.x}px`,
  '--aegis-y': `${heroPointer.y}px`,
}))

function handleHeroPointerMove(event: PointerEvent) {
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  heroPointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 28
  heroPointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 22
}

function resetHeroPointer() {
  heroPointer.x = 0
  heroPointer.y = 0
}

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
