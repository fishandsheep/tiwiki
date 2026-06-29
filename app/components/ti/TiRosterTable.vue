<template>
  <section class="card overflow-hidden">
    <div class="border-b border-edge px-3.5 py-2.5 lg:px-5 lg:py-4">
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
        class="relative scroll-mt-24 px-3.5 py-3.5 transition-colors duration-500 lg:px-5 lg:py-5"
        :class="activeTeamId === team.teamId ? 'bg-gold/10' : ''"
      >
        <div class="flex flex-wrap items-center gap-2 pr-7 lg:pr-8">
          <div class="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-edge bg-bg-subtle lg:h-9 lg:w-9">
            <img
              v-if="team.teamLogo"
              v-media-zoom="{ src: team.teamLogo, alt: `${team.teamName} logo`, caption: team.teamName, subcaption: team.region, kind: 'logo' }"
              :src="team.teamLogo"
              :alt="`${team.teamName} logo`"
              class="max-h-7 max-w-7 object-contain"
              loading="lazy"
            >
            <span v-else class="text-xs font-bold text-gold">{{ initials(team.teamName) }}</span>
          </div>
          <h4 class="min-w-0 break-words text-sm font-bold leading-5 text-ink-main lg:text-base">{{ team.teamName }}</h4>
          <span v-if="team.region" class="chip text-[10px]">{{ team.region }}</span>
          <span v-if="team.inviteType" class="chip text-[10px]">{{ team.inviteType }}</span>
          <a
            v-if="team.teamLiquipediaUrl"
            :href="team.teamLiquipediaUrl"
            target="_blank"
            rel="noreferrer"
            class="wiki-link-icon absolute right-3 top-3 lg:right-5 lg:top-5"
            aria-label="打开战队 Liquipedia 页面"
          >
            <Icon name="external" :size="12" />
          </a>
        </div>

        <ul class="mt-2.5 grid grid-cols-2 gap-1.5 lg:mt-3 lg:gap-3 xl:grid-cols-3">
          <li
            v-for="player in team.players"
            :key="player.playerId + player.role"
            class="relative flex min-h-[84px] items-center gap-2 rounded-lg border border-edge bg-bg-subtle px-2.5 py-2.5 lg:min-h-[92px] lg:gap-2.5 lg:px-3 lg:py-3"
          >
            <div class="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-gold/20 bg-bg-card lg:h-10 lg:w-10">
              <img
                v-if="player.avatar"
                v-media-zoom="{ src: player.avatar, alt: player.handle, caption: player.handle, subcaption: [player.role || '选手', player.country].filter(Boolean).join(' · '), kind: 'avatar' }"
                :src="player.avatar"
                :alt="player.handle"
                class="h-full w-full object-cover"
                loading="lazy"
              >
              <span v-else class="text-xs font-bold text-gold">{{ initials(player.handle) }}</span>
            </div>
            <div class="min-w-0 flex-1 py-0.5">
              <p class="min-w-0 break-words pr-5 text-sm font-medium leading-5 text-ink-main lg:text-base">{{ player.handle }}</p>
              <p class="mt-0.5 text-xs leading-4.5 text-ink-muted lg:text-sm lg:leading-5">
                {{ [player.role || '选手', player.country].filter(Boolean).join(' · ') }}
              </p>
            </div>
            <a
              v-if="player.liquipediaUrl"
              :href="player.liquipediaUrl"
              target="_blank"
              rel="noreferrer"
              class="wiki-link-icon absolute right-2.5 top-2.5 lg:right-3 lg:top-3"
              aria-label="打开选手 Liquipedia 页面"
            >
              <Icon name="external" :size="12" />
            </a>
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
  return cleaned.slice(0, 2).toUpperCase() || 'Ti'
}
</script>
