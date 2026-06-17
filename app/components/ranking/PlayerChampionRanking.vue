<template>
  <div class="card overflow-hidden">
    <div class="border-b border-edge px-3.5 py-2.5 lg:px-5 lg:py-4">
      <h3 class="text-base font-bold text-ink-main lg:text-lg">冠军数量排行</h3>
      <p class="text-xs text-ink-muted lg:text-sm">已统计 {{ players.length }} 位 Ti冠军选手</p>
    </div>

    <div class="grid gap-px bg-edge md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="(player, i) in players"
        :key="player.playerId"
        class="relative flex items-start gap-2.5 bg-bg-card px-3.5 py-3.5 sm:min-h-[204px] lg:gap-3 lg:px-5 lg:py-4 xl:min-h-[220px]"
      >
        <div class="flex w-10 shrink-0 flex-col items-center gap-1.5 lg:w-12 lg:gap-2">
          <span class="text-xs font-mono text-ink-muted">#{{ i + 1 }}</span>
          <div
            class="champion-avatar grid h-10 w-10 place-items-center rounded-full border border-gold/25 text-sm font-bold text-gold lg:h-11 lg:w-11"
            :style="{ background: avatarBg(player.handle) }"
          >
            <img v-if="player.avatar" :src="player.avatar" :alt="player.handle" class="champion-avatar-img" loading="lazy">
            <span v-else>{{ initials(player.handle) }}</span>
          </div>
        </div>

        <div class="min-w-0 flex-1 pr-5 lg:pr-6">
          <div class="flex flex-wrap items-center gap-1.5">
            <h4 class="min-w-0 max-w-full break-words text-[15px] font-bold leading-5 text-ink-main lg:text-lg">{{ player.handle }}</h4>
            <span class="chip chip-gold">{{ player.championshipCount }} 冠</span>
            <span class="chip">{{ nationality(player) }}</span>
          </div>

          <p class="mt-1.5 text-xs text-ink-muted lg:mt-2 lg:text-sm">夺冠年份</p>
          <div class="mt-1 flex flex-wrap gap-1">
            <span
              v-for="year in player.championshipYears"
              :key="year"
              class="rounded-md border border-edge bg-bg-subtle px-2 py-1 text-xs text-ink-main"
            >
              {{ year }}
            </span>
          </div>

          <p class="mt-1.5 text-xs text-ink-muted lg:mt-2 lg:text-sm">对应届次</p>
          <div class="mt-1 flex flex-wrap gap-1">
            <NuxtLink
              v-for="championship in player.championships"
              :key="`${player.playerId}-${championship.routeId}`"
              :to="`/ti/${championship.routeId}`"
              class="ti-wordmark text-[11px] transition-opacity hover:opacity-80 lg:text-xs"
            >
              {{ formatTiLabel(championship.tiNo) }}
            </NuxtLink>
          </div>
        </div>
        <a
          v-if="player.liquipediaUrl"
          :href="player.liquipediaUrl"
          target="_blank"
          rel="noreferrer"
          class="wiki-link-icon absolute right-3 top-3 lg:right-5 lg:top-4"
          aria-label="打开选手 Liquipedia 页面"
        >
          <Icon name="external" :size="12" />
        </a>
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
  const variants = [
    'linear-gradient(135deg, rgb(var(--red) / 0.5), rgb(var(--bg-subtle)))',
    'linear-gradient(135deg, rgb(var(--gold) / 0.36), rgb(var(--bg-subtle)))',
    'linear-gradient(135deg, rgb(var(--ember) / 0.42), rgb(var(--bg-subtle)))',
    'linear-gradient(135deg, rgb(var(--teal) / 0.38), rgb(var(--bg-subtle)))',
  ]
  return variants[hash % variants.length]
}

function nationality(player: PlayerChampionRow) {
  return player.country || player.region || '国籍待补'
}
</script>

<style scoped>
.champion-avatar {
  overflow: hidden;
}

.champion-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 18%;
  transform: scale(1.28);
  transform-origin: 50% 20%;
}
</style>
