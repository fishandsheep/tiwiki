<template>
  <div class="card overflow-hidden">
    <div class="border-b border-edge px-3.5 py-2.5 lg:px-5 lg:py-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-base font-bold text-ink-main lg:text-lg">冠军数量排行</h3>
          <p class="text-xs text-ink-muted lg:text-sm">
            <template v-if="q">匹配 {{ filteredPlayers.length }} / {{ players.length }} 位 Ti冠军选手</template>
            <template v-else>已统计 {{ players.length }} 位 Ti冠军选手</template>
          </p>
        </div>

        <label class="relative block lg:w-[18rem]">
          <span class="sr-only">搜索冠军选手</span>
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            <Icon name="search" :size="15" />
          </span>
          <input
            ref="inputEl"
            v-model="q"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            autocomplete="off"
            spellcheck="false"
            maxlength="40"
            placeholder="搜索选手 / 国家 / 年份 / Ti"
            class="min-h-11 w-full rounded-lg border border-edge bg-bg-card py-2.5 pl-9 pr-16 text-sm text-ink-main placeholder:text-ink-muted/70 transition-colors focus:border-gold/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40"
            @keydown.esc.prevent="clear"
          >
          <button
            v-if="q"
            type="button"
            class="absolute right-2 top-1/2 inline-flex min-h-10 -translate-y-1/2 items-center rounded px-3 py-1 text-xs text-ink-muted transition-colors hover:text-gold"
            aria-label="清空搜索"
            @click="clear"
          >清空</button>
        </label>
      </div>
    </div>

    <div v-if="filteredPlayers.length" class="grid gap-px bg-edge md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="(player, i) in filteredPlayers"
        :key="player.playerId"
        class="relative flex items-start gap-2.5 bg-bg-card px-3.5 py-3.5 sm:min-h-[204px] lg:gap-3 lg:px-5 lg:py-4 xl:min-h-[220px]"
      >
        <div class="flex w-10 shrink-0 flex-col items-center gap-1.5 lg:w-12 lg:gap-2">
          <span class="text-xs font-mono text-ink-muted">#{{ i + 1 }}</span>
          <div
            class="champion-avatar grid h-10 w-10 place-items-center rounded-full border border-gold/25 text-sm font-bold text-gold lg:h-11 lg:w-11"
            :style="{ background: avatarBg(player.handle) }"
          >
            <img
              v-if="player.avatar"
              v-media-zoom="{ src: player.avatar, alt: player.handle, caption: player.handle, subcaption: nationality(player), kind: 'avatar' }"
              :src="player.avatar"
              :alt="player.handle"
              class="champion-avatar-img"
              loading="lazy"
            >
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
            <NuxtLink
              v-for="championship in player.championships"
              :key="`${player.playerId}-year-${championship.routeId}`"
              :to="`/ti/${championship.routeId}`"
              class="championship-link group"
            >
              <span>{{ championship.year }}</span>
            </NuxtLink>
          </div>

          <p class="mt-1.5 text-xs text-ink-muted lg:mt-2 lg:text-sm">对应届次</p>
          <div class="mt-1 flex flex-wrap gap-1">
            <NuxtLink
              v-for="championship in player.championships"
              :key="`${player.playerId}-${championship.routeId}`"
              :to="`/ti/${championship.routeId}`"
              class="championship-link border-gold/30 bg-gold/10 text-gold hover:border-gold/60 hover:bg-gold/15"
            >
              <span class="ti-wordmark text-[11px] transition-opacity group-hover:opacity-90 lg:text-xs">
                {{ formatTiLabel(championship.tiNo) }}
              </span>
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

    <div v-else class="px-3.5 py-8 text-center lg:px-5">
      <p class="text-sm text-ink-muted">未找到匹配「{{ q }}」的冠军选手。</p>
      <button
        type="button"
        class="mt-3 rounded-lg border border-edge px-3 py-1.5 text-sm text-ink-main transition-colors hover:border-gold/60"
        @click="clear"
      >清空搜索</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTiLabel } from '~/composables/tiData'
import type { PlayerChampionRow } from '~/types/ti'

const props = defineProps<{ players: PlayerChampionRow[] }>()
const q = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const searchableText = computed(() => {
  return new Map(
    props.players.map((player) => [
      player.playerId,
      [
        player.handle,
        player.country,
        player.region,
        ...player.championshipYears.map(String),
        ...player.championships.flatMap((championship) => [formatTiLabel(championship.tiNo), `ti${championship.tiNo}`]),
      ]
        .join(' ')
        .toLowerCase(),
    ]),
  )
})

const filteredPlayers = computed(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return props.players
  return props.players.filter((player) => searchableText.value.get(player.playerId)?.includes(needle))
})

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

function clear() {
  q.value = ''
  inputEl.value?.focus()
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
}

.championship-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid rgb(var(--border) / 0.9);
  border-radius: 0.5rem;
  background: rgb(var(--bg-subtle) / 0.92);
  padding: 0.35rem 0.55rem;
  font-size: 0.75rem;
  line-height: 1;
  color: rgb(var(--text-main));
  text-decoration: none;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.championship-link:hover {
  border-color: rgb(var(--gold) / 0.5);
  background: rgb(var(--gold) / 0.08);
  color: rgb(var(--gold));
  transform: translateY(-1px);
}

.championship-link:focus-visible {
  outline: 1px solid rgb(var(--gold) / 0.72);
  outline-offset: 2px;
}

</style>
