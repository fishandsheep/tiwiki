<template>
  <div class="card overflow-hidden">
    <div class="border-b border-edge px-4 py-3">
      <h3 class="text-base font-bold text-ink-main">最终排名</h3>
      <p class="text-xs text-ink-muted">共 {{ placements.length }} 支队伍</p>
    </div>

    <div v-if="status === 'cancelled'" class="px-4 py-8 text-center text-sm text-ink-muted">
      该届赛事已取消，未产生最终排名。
    </div>

    <div v-else class="scroll-x overflow-x-auto">
      <table class="w-full min-w-[480px] sm:min-w-[560px] text-sm">
        <thead>
          <tr class="border-b border-edge text-left text-xs text-ink-muted">
            <th class="px-4 py-2 font-bold">名次</th>
            <th class="px-4 py-2 font-bold">队伍</th>
            <th class="px-4 py-2 font-bold">赛区</th>
            <th class="px-4 py-2 font-bold">出线</th>
            <th class="px-4 py-2 font-bold">奖金</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-edge">
          <tr v-for="p in placements" :key="p.teamId + p.rank" class="transition-colors hover:bg-bg-subtle">
            <td class="px-4 py-2.5">
              <span class="font-mono font-bold" :class="rankColor(p.rank)">{{ p.rank }}</span>
            </td>
            <td class="px-4 py-2.5">
              <a
                :href="`#roster-${p.teamId}`"
                class="font-medium transition-colors hover:text-gold"
                :class="p.isChinaTeam ? 'text-gold' : 'text-ink-main'"
              >{{ p.teamName }}</a>
            </td>
            <td class="px-4 py-2.5 text-ink-muted">{{ p.region || '—' }}</td>
            <td class="px-4 py-2.5">
              <span v-if="p.inviteType" class="chip text-[10px]">{{ p.inviteType }}</span>
              <span v-else class="text-ink-muted">—</span>
            </td>
            <td class="px-4 py-2.5 font-mono text-xs text-ink-muted">
              {{ p.prizeUsd ? formatUsd(p.prizeUsd) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatUsd } from '~/composables/tiData'
import type { Placement, TournamentStatus } from '~/types/ti'

defineProps<{ placements: Placement[]; status?: TournamentStatus }>()

function rankColor(rank: number) {
  if (rank === 1) return 'text-gold'
  if (rank === 2) return 'text-ink-main'
  if (rank <= 4) return 'text-ink-muted'
  return 'text-ink-muted'
}
</script>
