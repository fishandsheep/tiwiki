<template>
  <div class="card reveal overflow-hidden border-red/30">
    <div class="border-b border-edge bg-red/5 px-4 py-3 lg:px-5 lg:py-4">
      <h3 class="flex items-center gap-2 text-base font-bold text-ink-main lg:text-lg">
        🇨🇳 中国战队表现
      </h3>
    </div>

    <div class="p-4 lg:p-5">
      <div class="flex flex-wrap items-center gap-2 rounded-lg border border-edge bg-bg-subtle p-3 sm:gap-3">
        <span class="text-xs text-ink-muted lg:text-sm">本届最佳</span>
        <button
          type="button"
          class="min-w-0 text-left text-base font-black transition-colors hover:text-gold lg:text-lg"
          :class="perf.bestRank === 1 ? 'text-gold' : 'text-ink-main'"
          @click="emit('focus-team', perf.teams[0]?.teamId || '')"
        >
          {{ perf.bestTeamName }}
        </button>
        <span class="chip sm:ml-auto" :class="perf.bestRank === 1 ? 'chip-gold' : ''">{{ perf.bestPlacement }}</span>
      </div>

      <p class="mt-3 text-sm leading-relaxed text-ink-muted lg:text-base lg:leading-8">{{ perf.summary }}</p>

      <ul class="mt-4 space-y-1.5 text-sm lg:text-base">
        <li
          v-for="(team, i) in perf.teams"
          :key="team.teamId + i"
          class="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-bg-subtle"
        >
          <span class="w-6 text-right font-mono text-xs text-ink-muted">{{ team.rank }}</span>
          <button
            type="button"
            class="min-w-0 flex-1 truncate text-left font-medium text-ink-main transition-colors hover:text-gold"
            @click="emit('focus-team', team.teamId)"
          >
            {{ team.teamName }}
          </button>
          <span class="chip shrink-0" :class="team.rank === 1 ? 'chip-gold' : ''">{{ team.placement }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChinaPerformance } from '~/types/ti'
defineProps<{ perf: ChinaPerformance }>()
const emit = defineEmits<{ 'focus-team': [teamId: string] }>()
</script>
