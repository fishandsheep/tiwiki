<template>
  <NuxtLink
    :to="`/ti/${tournament.routeId}`"
    class="card card-hover reveal block p-4 lg:p-5"
  >
    <div class="flex items-baseline justify-between">
      <span class="text-lg font-black text-gold lg:text-xl">
        {{ tournament.status === 'cancelled' ? tournament.year : formatTiLabel(tournament.tiNo) }}
      </span>
      <span class="text-xs text-ink-muted lg:text-sm">{{ tournament.year }}</span>
    </div>

    <p class="mt-0.5 truncate text-sm text-ink-muted lg:text-base">{{ tournament.nameZh }}</p>

    <dl class="mt-3 space-y-1.5 text-sm lg:text-base">
      <div class="flex justify-between gap-2">
        <dt class="shrink-0 text-ink-muted">{{ tournament.status === 'ongoing' ? '状态' : '冠军' }}</dt>
        <dd class="min-w-0 truncate text-right font-medium text-ink-main">{{ tournament.champion }}</dd>
      </div>
      <div class="flex justify-between gap-2">
        <dt class="shrink-0 text-ink-muted">亚军</dt>
        <dd class="min-w-0 truncate text-right text-ink-muted">{{ tournament.runnerUp }}</dd>
      </div>
      <div class="flex justify-between gap-2">
        <dt class="text-ink-muted">奖金池</dt>
        <dd class="font-mono text-xs text-ink-main lg:text-sm">{{ formatUsd(tournament.prizePoolUsd) }}</dd>
      </div>
    </dl>

    <div v-if="tournament.status === 'cancelled'" class="mt-3">
      <span class="chip">赛事取消</span>
    </div>
    <div v-else-if="tournament.status === 'ongoing'" class="mt-3">
      <span class="chip chip-gold">最终排名待定</span>
    </div>
    <div v-else-if="chinaTag" class="mt-3">
      <span class="chip chip-red">{{ chinaTag }}</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { formatUsd, formatTiLabel, placementLabel } from '~/composables/tiData'
import type { Tournament } from '~/types/ti'

const props = defineProps<{ tournament: Tournament; bestChinaRank?: number | null }>()

const chinaTag = computed(() => {
  if (props.tournament.status !== 'completed') return ''
  const r = props.bestChinaRank
  if (r == null) return ''
  if (r === 1) return `🇨🇳 ${placementLabel(r)}`
  return `🇨🇳 中国最佳：${placementLabel(r)}`
})
</script>
