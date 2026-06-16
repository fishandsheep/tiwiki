<template>
  <div class="card divide-y divide-edge">
    <div
      v-for="(p, i) in prizePools"
      :key="p.tiNo"
      class="grid grid-cols-[1.5rem_3.75rem_1fr] items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex sm:gap-3 sm:py-2.5"
    >
      <span class="text-center font-mono text-xs text-ink-muted sm:w-5">{{ i + 1 }}</span>
      <NuxtLink :to="`/ti/${p.routeId}`" class="inline-flex min-h-11 items-center font-black text-ink-main transition-colors hover:text-gold sm:min-h-0 sm:w-16">{{ formatTiLabel(p.tiNo) }}</NuxtLink>
      <span class="text-xs text-ink-muted sm:w-12">{{ p.year }}</span>
      <!-- bar -->
      <div class="col-span-2 col-start-2 min-w-0 sm:col-auto sm:flex-1">
        <div class="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
          <div class="h-full rounded-full bg-gold" :style="{ width: pct(p.prizePoolUsd) + '%' }" />
        </div>
      </div>
      <span class="col-span-2 col-start-2 font-mono text-xs text-ink-main sm:col-auto sm:w-28 sm:text-right">{{ formatUsd(p.prizePoolUsd) }}</span>
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
