<template>
  <NuxtLink
    :to="`/ti/${tournament.routeId}`"
    class="card card-hover reveal group block overflow-hidden p-0"
  >
    <div class="grid gap-0 lg:grid-cols-[260px_1fr]">
      <!-- 左:Ti编号铭牌 -->
      <div class="relative flex flex-col justify-between gap-4 border-b border-edge p-6 lg:border-b-0 lg:border-r">
        <div>
          <span class="chip" :class="tournament.status === 'cancelled' ? '' : 'chip-gold'">
            {{ tournament.status === 'cancelled' ? '取消' : tournament.status === 'ongoing' ? '最新赛事' : '最新结果' }}
          </span>
          <p class="mt-4 text-5xl font-black leading-none text-gold sm:text-6xl">
            {{ tournament.status === 'cancelled' ? tournament.year : formatTiLabel(tournament.tiNo) }}
          </p>
          <p class="mt-1 text-sm text-ink-muted lg:text-base">{{ tournament.year }} · {{ tournament.city }}</p>
        </div>
        <p class="text-xs text-ink-muted lg:text-sm">{{ tournament.nameZh }}</p>
      </div>

      <!-- 右:冠军 + 奖金 + 简介 -->
      <div class="p-6">
        <div class="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div>
            <p class="text-xs uppercase tracking-wide text-ink-muted lg:text-sm">{{ tournament.status === 'ongoing' ? '状态' : '冠军' }}</p>
            <p class="text-2xl font-black text-gold lg:text-3xl">{{ tournament.champion }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-ink-muted lg:text-sm">奖金池</p>
            <p class="font-mono text-lg font-bold text-ink-main lg:text-xl">{{ formatUsd(tournament.prizePoolUsd) }}</p>
          </div>
        </div>

        <p class="mt-4 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-muted lg:text-base lg:leading-8">
          {{ tournament.summaryZh }}
        </p>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <span v-if="tournament.status === 'cancelled'" class="chip">赛事取消</span>
          <span v-else-if="tournament.status === 'ongoing'" class="chip chip-gold">最终排名待定</span>
          <span v-if="chinaTag" class="chip" :class="tournament.bestChinaRank === 1 ? 'chip-gold' : 'chip-red'">{{ chinaTag }}</span>
          <span class="chip">亚军 {{ tournament.runnerUp }}</span>
          <span class="ml-auto text-sm font-medium text-gold transition-transform group-hover:translate-x-1 lg:text-base">查看详情 →</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { formatUsd, formatTiLabel, placementLabel } from '~/composables/tiData'
import type { Tournament } from '~/types/ti'

const props = defineProps<{ tournament: Tournament & { bestChinaRank?: number | null } }>()

const chinaTag = computed(() => {
  if (props.tournament.status !== 'completed') return ''
  const r = props.tournament.bestChinaRank
  if (r == null) return ''
  if (r === 1) return `🇨🇳 ${placementLabel(r)}`
  return `🇨🇳 中国最佳 ${placementLabel(r)}`
})
</script>
