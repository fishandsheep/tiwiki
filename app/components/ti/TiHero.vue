<template>
  <section v-reveal class="reveal relative overflow-hidden border-b border-edge">
    <div class="ti-hero-glow pointer-events-none absolute inset-0" />
    <div class="relative mx-auto max-w-shell px-3 py-7 sm:px-4 sm:py-10 lg:py-12">
      <NuxtLink to="/ti" class="inline-flex min-h-11 items-center text-xs text-ink-muted transition-colors hover:text-gold lg:text-sm">← 历届赛事</NuxtLink>
      <div class="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="text-3xl font-black text-gold sm:text-5xl">
          <template v-if="t.status === 'cancelled'">{{ t.year }}</template>
          <template v-else><span class="ti-wordmark text-3xl sm:text-5xl">{{ formatTiLabel(t.tiNo) }}</span></template>
        </span>
        <span class="text-sm text-ink-muted sm:text-base lg:text-lg">{{ t.year }}</span>
      </div>
      <h1 class="mt-1 text-xl font-bold text-ink-main sm:text-2xl lg:text-3xl">{{ t.nameZh }}</h1>
      <p class="mt-1 break-words text-sm text-ink-muted lg:text-base">{{ t.name }}</p>

      <div class="mt-4 flex max-w-full flex-col items-start gap-2 sm:flex-row sm:flex-wrap">
        <span v-if="t.status === 'cancelled'" class="chip">赛事取消</span>
        <span v-else-if="t.status === 'ongoing'" class="chip chip-gold">参赛名单已定</span>
        <span class="chip"><Icon name="pin" :size="13" /> {{ t.city }} · {{ t.country }}</span>
        <span class="chip max-w-full min-w-0"><Icon name="building" :size="13" /> <span class="min-w-0 truncate">{{ t.venue }}</span></span>
        <span class="chip"><Icon name="calendar" :size="13" /> {{ formatDateRange(t.startDate, t.endDate, t.status) }}</span>
        <span class="chip chip-gold"><Icon name="dollar" :size="13" /> {{ formatUsd(t.prizePoolUsd) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatUsd, formatDateRange, formatTiLabel } from '~/composables/tiData'
import type { Tournament } from '~/types/ti'
defineProps<{ t: Tournament }>()
</script>
