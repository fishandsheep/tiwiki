<template>
  <div class="card divide-y divide-edge">
    <NuxtLink
      v-for="(c, i) in chinaTeams"
      :key="c.tiNo"
      :to="`/ti/${c.routeId}`"
      class="grid grid-cols-[1.25rem_3.75rem_1fr] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-bg-subtle sm:flex sm:gap-3 sm:py-2.5"
    >
      <span class="text-center font-mono text-xs text-ink-muted sm:w-5">{{ i + 1 }}</span>
      <span class="font-black sm:w-16" :class="c.bestRank === 1 ? 'text-gold' : 'text-ink-main'">{{ formatTiLabel(c.tiNo) }}</span>
      <span class="min-w-0 truncate text-sm font-medium text-ink-main sm:flex-1">{{ c.bestTeamName }}</span>
      <span class="chip col-start-3 justify-self-start" :class="chipClass(c.bestRank)">{{ c.bestPlacement }}</span>
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
