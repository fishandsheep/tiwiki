<template>
  <section class="card overflow-hidden">
    <div class="border-b border-edge px-4 py-3">
      <h3 class="text-base font-bold text-ink-main">参赛阵容</h3>
      <p class="text-xs text-ink-muted">
        {{ status === 'cancelled' ? '赛事取消，无参赛阵容。' : `共 ${rosters.length} 支队伍` }}
      </p>
    </div>

    <div class="divide-y divide-edge">
      <div :id="`roster-${team.teamId}`" v-for="team in rosters" :key="team.teamId" class="scroll-mt-24 px-4 py-4">
        <div class="flex flex-wrap items-center gap-2">
          <h4 class="text-sm font-bold text-ink-main">{{ team.teamName }}</h4>
          <span v-if="team.region" class="chip text-[10px]">{{ team.region }}</span>
          <span v-if="team.inviteType" class="chip text-[10px]">{{ team.inviteType }}</span>
        </div>

        <ul class="mt-3 grid gap-2 sm:grid-cols-2">
          <li
            v-for="player in team.players"
            :key="player.playerId + player.role"
            class="rounded-lg border border-edge bg-bg-subtle px-3 py-2"
          >
            <p class="text-sm font-medium text-ink-main">{{ player.handle }}</p>
            <p class="mt-0.5 text-xs text-ink-muted">{{ player.role || '选手' }}</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TeamRoster, TournamentStatus } from '~/types/ti'

defineProps<{ rosters: TeamRoster[]; status: TournamentStatus }>()
</script>
