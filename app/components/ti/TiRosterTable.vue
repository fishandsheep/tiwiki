<template>
  <section class="card overflow-hidden">
    <div class="border-b border-edge px-4 py-3 lg:px-5 lg:py-4">
      <h3 class="text-base font-bold text-ink-main lg:text-lg">参赛阵容</h3>
      <p class="text-xs text-ink-muted lg:text-sm">
        {{ status === 'cancelled' ? '赛事取消，无参赛阵容。' : `共 ${rosters.length} 支队伍` }}
      </p>
    </div>

    <div class="divide-y divide-edge">
      <div
        :id="`roster-${team.teamId}`"
        v-for="team in rosters"
        :key="team.teamId"
        class="scroll-mt-24 px-4 py-4 transition-colors duration-500 lg:px-5 lg:py-5"
        :class="activeTeamId === team.teamId ? 'bg-gold/10' : ''"
      >
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-edge bg-bg-subtle">
            <img v-if="team.teamLogo" :src="team.teamLogo" :alt="`${team.teamName} logo`" class="max-h-7 max-w-7 object-contain" loading="lazy">
            <span v-else class="text-xs font-bold text-gold">{{ initials(team.teamName) }}</span>
          </div>
          <h4 class="min-w-0 break-words text-sm font-bold text-ink-main lg:text-base">{{ team.teamName }}</h4>
          <span v-if="team.region" class="chip text-[10px]">{{ team.region }}</span>
          <span v-if="team.inviteType" class="chip text-[10px]">{{ team.inviteType }}</span>
          <a
            v-if="team.teamLiquipediaUrl"
            :href="team.teamLiquipediaUrl"
            target="_blank"
            rel="noreferrer"
            class="wiki-link wiki-link-compact"
            aria-label="打开战队 Liquipedia 页面"
          >
            <span class="wiki-link-icon"><Icon name="external" :size="10" /></span>
            <span>Liquipedia</span>
          </a>
        </div>

        <ul class="mt-3 grid gap-2 sm:grid-cols-2 lg:gap-3 xl:grid-cols-3">
          <li
            v-for="player in team.players"
            :key="player.playerId + player.role"
            class="flex min-h-16 items-start gap-3 rounded-lg border border-edge bg-bg-subtle px-3 py-3"
          >
            <div class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-gold/20 bg-bg-card">
              <img v-if="player.avatar" :src="player.avatar" :alt="player.handle" class="h-full w-full object-cover" loading="lazy">
              <span v-else class="text-xs font-bold text-gold">{{ initials(player.handle) }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="break-words text-sm font-medium leading-snug text-ink-main lg:text-base">{{ player.handle }}</p>
              <p class="mt-0.5 text-xs text-ink-muted lg:text-sm">
                {{ [player.role || '选手', player.country].filter(Boolean).join(' · ') }}
              </p>
              <div v-if="player.liquipediaUrl" class="mt-2">
                <a
                  :href="player.liquipediaUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="wiki-link wiki-link-compact"
                  aria-label="打开选手 Liquipedia 页面"
                >
                  <span class="wiki-link-icon"><Icon name="external" :size="10" /></span>
                  <span>Liquipedia</span>
                </a>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TeamRoster, TournamentStatus } from '~/types/ti'

defineProps<{ rosters: TeamRoster[]; status: TournamentStatus; activeTeamId?: string }>()

function initials(value: string) {
  const cleaned = value.replace(/[^a-z0-9]/gi, '')
  return cleaned.slice(0, 2).toUpperCase() || 'TI'
}
</script>
