<template>
  <div class="card overflow-hidden">
    <div class="border-b border-edge px-4 py-3">
      <h3 class="text-base font-bold text-ink-main">冠军数量排行</h3>
      <p class="text-xs text-ink-muted">已统计 {{ players.length }} 位 ti 冠军选手</p>
    </div>

    <div class="grid gap-px bg-edge sm:grid-cols-2">
      <article
        v-for="(player, i) in players"
        :key="player.playerId"
        class="flex gap-3 bg-bg-card px-4 py-4"
      >
        <div class="flex w-12 shrink-0 flex-col items-center gap-2">
          <span class="text-xs font-mono text-ink-muted">#{{ i + 1 }}</span>
          <div
            class="grid h-11 w-11 place-items-center rounded-full border border-gold/25 text-sm font-bold text-gold"
            :style="{ background: avatarBg(player.handle) }"
          >
            {{ initials(player.handle) }}
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="truncate text-base font-bold text-ink-main">{{ player.handle }}</h4>
            <span class="chip chip-gold">{{ player.championshipCount }} 冠</span>
            <span class="chip">{{ nationality(player) }}</span>
          </div>

          <p class="mt-2 text-xs text-ink-muted">夺冠年份</p>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <span
              v-for="year in player.championshipYears"
              :key="year"
              class="rounded-md border border-edge bg-bg-subtle px-2 py-1 text-xs text-ink-main"
            >
              {{ year }}
            </span>
          </div>

          <p class="mt-2 text-xs text-ink-muted">对应届次</p>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <span
              v-for="tiNo in player.championshipTiNos"
              :key="tiNo"
              class="ti-wordmark text-xs"
            >
              {{ formatTiLabel(tiNo) }}
            </span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTiLabel } from '~/composables/tiData'
import type { PlayerChampionRow } from '~/types/ti'

defineProps<{ players: PlayerChampionRow[] }>()

function initials(handle: string) {
  const cleaned = handle.replace(/[^a-z0-9]/gi, '')
  return cleaned.slice(0, 2).toUpperCase() || 'TT'
}

function avatarBg(seed: string) {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 360
  return `linear-gradient(135deg, hsl(${hash} 70% 28%), hsl(${(hash + 28) % 360} 80% 18%))`
}

function nationality(player: PlayerChampionRow) {
  return player.country || player.region || '国籍待补'
}
</script>
