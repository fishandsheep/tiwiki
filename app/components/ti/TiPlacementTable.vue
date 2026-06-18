<template>
  <div class="card overflow-hidden">
    <div class="border-b border-edge px-3.5 py-2.5 lg:px-5 lg:py-4">
      <h3 class="text-base font-bold text-ink-main lg:text-lg">最终排名</h3>
      <p class="text-xs text-ink-muted lg:text-sm">共 {{ placements.length }} 支队伍</p>
    </div>

    <div v-if="status === 'cancelled'" class="px-4 py-8 text-center text-sm text-ink-muted">
      该届赛事已取消，未产生最终排名。
    </div>

    <template v-else>
      <div class="divide-y divide-edge sm:hidden">
        <article
          v-for="p in placements"
          :key="p.teamId + p.rank"
          class="px-3.5 py-2.5"
        >
          <div class="flex min-w-0 items-start gap-2.5">
            <span class="w-7 shrink-0 pt-1 text-center font-mono text-sm font-bold" :class="rankColor(p.rank)">{{ p.rank }}</span>
            <div class="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-edge bg-bg-subtle">
              <img
                v-if="p.teamLogo"
                v-media-zoom="{ src: p.teamLogo, alt: `${p.teamName} logo`, caption: p.teamName, subcaption: p.region, kind: 'logo' }"
                :src="p.teamLogo"
                :alt="`${p.teamName} logo`"
                class="max-h-7 max-w-7 object-contain"
                loading="lazy"
              >
              <span v-else class="text-xs font-bold text-gold">{{ initials(p.teamName) }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <button
                type="button"
                class="flex min-w-0 items-center text-left text-sm font-medium leading-5 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
                :class="p.isChinaTeam ? 'text-gold' : 'text-ink-main'"
                @click="emit('focus-team', p.teamId)"
              ><span class="truncate">{{ p.teamName }}</span></button>
              <div class="mt-0.5 flex flex-wrap items-center gap-1">
                <span class="text-xs text-ink-muted">{{ p.region || '赛区待补' }}</span>
                <span v-if="p.inviteType" class="chip text-[10px]">{{ p.inviteType }}</span>
              </div>
            </div>
            <span class="shrink-0 pt-1 text-right font-mono text-[11px] leading-5 text-ink-muted">
              {{ p.prizeUsd ? formatUsd(p.prizeUsd) : '—' }}
            </span>
          </div>
        </article>
      </div>

      <div class="scroll-x hidden overflow-x-auto sm:block">
        <table class="w-full min-w-[640px] text-sm lg:text-base">
          <thead>
            <tr class="border-b border-edge text-left text-xs text-ink-muted">
              <th class="px-4 py-2.5 font-bold">名次</th>
              <th class="px-4 py-2.5 font-bold">队伍</th>
              <th class="px-4 py-2.5 font-bold">赛区</th>
              <th class="px-4 py-2.5 font-bold">出线</th>
              <th class="px-4 py-2.5 font-bold">奖金</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-edge">
            <tr v-for="p in placements" :key="p.teamId + p.rank" class="transition-colors hover:bg-bg-subtle">
              <td class="px-4 py-3">
                <span class="font-mono font-bold" :class="rankColor(p.rank)">{{ p.rank }}</span>
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="inline-flex min-h-11 min-w-0 items-center gap-2 text-left font-medium transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
                  :class="p.isChinaTeam ? 'text-gold' : 'text-ink-main'"
                  @click="emit('focus-team', p.teamId)"
                >
                  <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-edge bg-bg-subtle">
                    <img
                      v-if="p.teamLogo"
                      v-media-zoom="{ src: p.teamLogo, alt: `${p.teamName} logo`, caption: p.teamName, subcaption: p.region, kind: 'logo', toggleOnClick: false }"
                      :src="p.teamLogo"
                      :alt="`${p.teamName} logo`"
                      class="max-h-6 max-w-6 object-contain"
                      loading="lazy"
                    >
                    <span v-else class="text-[10px] font-bold text-gold">{{ initials(p.teamName) }}</span>
                  </span>
                  <span class="truncate">{{ p.teamName }}</span>
                </button>
              </td>
              <td class="px-4 py-3 text-ink-muted">{{ p.region || '—' }}</td>
              <td class="px-4 py-3">
                <span v-if="p.inviteType" class="chip text-[10px]">{{ p.inviteType }}</span>
                <span v-else class="text-ink-muted">—</span>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-ink-muted lg:text-sm">
                {{ p.prizeUsd ? formatUsd(p.prizeUsd) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatUsd } from '~/composables/tiData'
import type { Placement, TournamentStatus } from '~/types/ti'

defineProps<{ placements: Placement[]; status?: TournamentStatus }>()
const emit = defineEmits<{ 'focus-team': [teamId: string] }>()

function rankColor(rank: number) {
  if (rank === 1) return 'text-gold'
  if (rank === 2) return 'text-ink-main'
  if (rank <= 4) return 'text-ink-muted'
  return 'text-ink-muted'
}

function initials(value: string) {
  const cleaned = value.replace(/[^a-z0-9]/gi, '')
  return cleaned.slice(0, 2).toUpperCase() || 'TI'
}
</script>
