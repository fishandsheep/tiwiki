<template>
  <div class="card divide-y divide-edge">
    <NuxtLink
      v-for="(c, i) in chinaTeams"
      :key="c.tiNo"
      :to="`/ti/${c.routeId}`"
      class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-subtle"
    >
      <span class="w-5 text-center font-mono text-xs text-ink-muted">{{ i + 1 }}</span>
      <span class="w-16 font-black" :class="c.bestRank === 1 ? 'text-gold' : 'text-ink-main'">{{ formatTiLabel(c.tiNo) }}</span>
      <span class="flex-1 truncate text-sm font-medium text-ink-main">{{ c.bestTeamName }}</span>
      <span class="chip" :class="chipClass(c.bestRank)">{{ c.bestPlacement }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { formatTiLabel } from '~/composables/tiData'
import type { ChinaAggregateRow } from '~/types/ti'

defineProps<{ chinaTeams: ChinaAggregateRow[] }>()

function chipClass(rank: number) {
  if (rank === 1) return 'chip-gold'
  if (rank === 2) return 'chip-red'
  return ''
}
</script>
