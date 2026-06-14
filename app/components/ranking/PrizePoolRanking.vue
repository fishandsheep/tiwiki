<template>
  <div class="card divide-y divide-edge">
    <div
      v-for="(p, i) in prizePools"
      :key="p.tiNo"
      class="flex items-center gap-3 px-4 py-2.5"
    >
      <span class="w-5 text-center font-mono text-xs text-ink-muted">{{ i + 1 }}</span>
      <NuxtLink :to="`/ti/${p.routeId}`" class="w-16 font-black text-ink-main transition-colors hover:text-gold">{{ formatTiLabel(p.tiNo) }}</NuxtLink>
      <span class="w-12 text-xs text-ink-muted">{{ p.year }}</span>
      <!-- bar -->
      <div class="flex-1">
        <div class="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
          <div class="h-full rounded-full bg-gold" :style="{ width: pct(p.prizePoolUsd) + '%' }" />
        </div>
      </div>
      <span class="w-28 text-right font-mono text-xs text-ink-main">{{ formatUsd(p.prizePoolUsd) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTiLabel, formatUsd } from '~/composables/tiData'
import type { PrizePoolRow } from '~/types/ti'

const props = defineProps<{ prizePools: PrizePoolRow[] }>()

function pct(val: number) {
  const max = props.prizePools[0]?.prizePoolUsd ?? 1
  return Math.round((val / max) * 100)
}
</script>
