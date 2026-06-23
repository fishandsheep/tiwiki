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
        class="ti-hero-backdrop pointer-events-none absolute inset-0"
        :style="heroMotionStyle"
      />
      <div
        class="ti-hero-glow pointer-events-none absolute inset-0"
        :style="heroMotionStyle"
      >
      </div>
      <div class="relative mx-auto grid min-h-[inherit] max-w-shell items-center gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-10 lg:py-0">
        <div class="min-w-0">
          <span class="chip chip-gold">Dota2 · The International</span>
          <h1 class="mt-3 text-[2.15rem] font-black leading-[1.06] text-ink-main sm:text-[2.7rem] lg:max-w-[12ch] lg:text-[3rem]">
            <span class="ti-wordmark text-[2.55rem] sm:text-[3.15rem] lg:text-[3.55rem]">ti</span> 百科
          </h1>
          <p class="mt-3 max-w-[62ch] text-[0.95rem] leading-7 text-ink-muted lg:max-w-[58ch]">
            Dota2 国际邀请赛中文资料库。按年份梳理冠军、奖金池、最终排名与中国战队表现，打开任一届，30 秒看清结果、背景与中国最佳名次。
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            <NuxtLink to="/ti" class="inline-flex min-h-11 items-center rounded-lg bg-gold px-4 py-2 text-sm font-bold text-bg-main shadow-[0_0_8px_rgb(var(--gold)/0.18)] transition-opacity hover:opacity-90">
              进入赛事索引 →
            </NuxtLink>
            <NuxtLink to="/china" class="inline-flex min-h-11 items-center rounded-lg border border-edge bg-bg-card/45 px-4 py-2 text-sm font-medium text-ink-main transition-colors hover:border-gold/60">
              看中国战绩
            </NuxtLink>
          </div>
        </div>

        <NuxtLink
          v-if="featured"
          :to="`/ti/${featured.routeId}`"
          class="card card-hover group block overflow-hidden p-0"
        >
          <div class="border-b border-edge bg-gold/6 px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <span class="chip chip-gold">最新结果</span>
              <span class="text-sm font-bold text-gold">{{ formatTiLabel(featured.tiNo) }}</span>
            </div>
            <p class="mt-2 text-lg font-black text-ink-main">{{ featured.nameZh }}</p>
            <p class="mt-1 text-sm text-ink-muted">{{ featured.year }} · {{ featured.city }}</p>
          </div>

          <div class="space-y-4 px-4 py-4">
            <div>
              <p class="text-xs text-ink-muted">冠军</p>
              <p class="mt-1 text-2xl font-black text-gold">{{ featured.champion }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-ink-muted">亚军</p>
                <p class="mt-1 text-base font-bold text-ink-main">{{ featured.runnerUp }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-muted">奖金池</p>
                <p class="mt-1 font-mono text-base font-bold text-ink-main">{{ formatUsd(featured.prizePoolUsd) }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span v-if="latestChinaTag" class="chip" :class="featured.bestChinaRank === 1 ? 'chip-gold' : 'chip-red'">{{ latestChinaTag }}</span>
              <span class="ml-auto text-sm font-medium text-gold transition-transform group-hover:translate-x-1">查看详情 →</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- 30 秒索引 -->
    <section v-reveal class="reveal mx-auto max-w-shell px-4 py-7">
      <div class="home-intro-band">
        <div class="min-w-0">
          <h2 class="text-lg font-black text-ink-main sm:text-xl">30 秒读懂 Ti</h2>
          <div class="mt-2 max-w-[66ch] space-y-1 text-sm leading-7 text-ink-muted">
            <p>The International（简称 Ti）是 Valve 主办的 Dota 2 世界最高规格赛事，自 2011 年起举办。</p>
            <p>这里按届次保留冠军、奖金池、队伍排名与中国战队最佳成绩，先给结论，再给完整数据。</p>
          </div>
        </div>

        <div class="home-metric-strip">
          <div v-for="s in statsCards" :key="s.label" class="home-metric">
            <p class="text-xs text-ink-muted">{{ s.label }}</p>
            <p class="mt-1 font-mono text-xl font-black text-ink-main">
              {{ s.value }}<span v-if="s.suffix" class="ml-0.5 font-sans text-sm font-medium text-ink-muted">{{ s.suffix }}</span>
            </p>
            <p v-if="s.sub" class="mt-0.5 text-xs text-gold/80">{{ s.sub }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心入口 -->
    <section class="mx-auto max-w-shell px-4 pb-4">
      <div v-reveal class="reveal home-route-rail">
        <NuxtLink
          v-for="e in entries"
          :key="e.to"
          :to="e.to"
          class="group home-route-link"
        >
          <span class="home-route-icon">
            <Icon :name="e.icon" :size="22" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-bold text-ink-main">{{ e.label }}</span>
            <span class="mt-0.5 block text-xs text-ink-muted">{{ e.desc }}</span>
          </span>
          <span class="ml-auto text-sm text-gold transition-transform group-hover:translate-x-1">→</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 历届赛事 -->
    <section class="mx-auto max-w-shell px-4 py-8">
      <SectionTitle title="历届赛事" to="/ti" />
      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TiCard
          v-for="(t, i) in tournaments"
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
import { formatUsd, formatTiLabel, placementLabel } from '~/composables/tiData'

const { data: tournaments } = await useTournaments()
const { data: stats } = await useStats()

const heroPointer = reactive({ x: 0, y: 0 })
const heroMotionStyle = computed(() => ({
  '--hero-x': `${heroPointer.x}px`,
  '--hero-y': `${heroPointer.y}px`,
  '--hero-bg-x': `${heroPointer.x * -0.58}px`,
  '--hero-bg-y': `${heroPointer.y * -0.46}px`,
  '--hero-glow-x': `${heroPointer.x * 0.32}px`,
  '--hero-glow-y': `${heroPointer.y * 0.28}px`,
  '--hero-hot-x': `${heroPointer.x * 0.3}px`,
  '--hero-hot-y': `${heroPointer.y * 0.26}px`,
  '--hero-rotate': `${heroPointer.x * 0.14}deg`,
}))

function handleHeroPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  heroPointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 58
  heroPointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 44
}

function resetHeroPointer() {
  heroPointer.x = 0
  heroPointer.y = 0
}

const featured = computed(() => tournaments.value[0] ?? null)

const latestChinaTag = computed(() => {
  if (!featured.value || featured.value.status === 'cancelled') return ''
  const r = featured.value.bestChinaRank
  if (r == null) return ''
  if (r === 1) return `🇨🇳 ${placementLabel(r)}`
  return `🇨🇳 中国最佳 ${placementLabel(r)}`
})

const statsCards = computed(() => [
  { label: '收录届数', value: String(stats.value.totalTIs) },
  { label: '中国冠军', value: String(stats.value.chinaChampionsCount), suffix: '次' },
  { label: '最高奖金池', value: formatUsd(stats.value.maxPrizePool), sub: 'Ti' + stats.value.maxPrizeTiNo },
])

const entries = [
  { to: '/ti', label: '历届赛事', icon: 'trophy', desc: 'Ti1 到 Ti14 与 2020' },
  { to: '/china', label: '中国战队', icon: 'pin', desc: '中国战队成绩' },
  { to: '/rankings', label: '榜单', icon: 'chart', desc: '奖金池 / 冠军选手' },
]
</script>
