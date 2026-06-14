<template>
  <div class="card reveal overflow-hidden border-red/30">
    <div class="border-b border-edge bg-red/5 px-4 py-3">
      <h3 class="flex items-center gap-2 text-base font-bold text-ink-main">
        🇨🇳 中国战队表现
      </h3>
    </div>

    <div class="p-4">
      <div class="flex items-center gap-3 rounded-lg border border-edge bg-bg-subtle p-3">
        <span class="text-xs text-ink-muted">本届最佳</span>
        <span class="text-base font-black" :class="perf.bestRank === 1 ? 'text-gold' : 'text-ink-main'">
          {{ perf.bestTeamName }}
        </span>
        <span class="ml-auto chip" :class="perf.bestRank === 1 ? 'chip-gold' : ''">{{ perf.bestPlacement }}</span>
      </div>

      <p class="mt-3 text-sm leading-relaxed text-ink-muted">{{ perf.summary }}</p>

      <ul class="mt-4 space-y-1.5 text-sm">
        <li
          v-for="(team, i) in perf.teams"
          :key="team.teamId + i"
          class="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-bg-subtle"
        >
          <span class="w-6 text-right font-mono text-xs text-ink-muted">{{ team.rank }}</span>
          <span class="font-medium text-ink-main">{{ team.teamName }}</span>
          <span class="ml-auto chip" :class="team.rank === 1 ? 'chip-gold' : ''">{{ team.placement }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChinaPerformance } from '~/types/ti'
defineProps<{ perf: ChinaPerformance }>()
</script>
