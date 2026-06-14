<template>
  <div v-reveal class="reveal card p-5">
    <h3 class="mb-4 text-base font-bold text-ink-main">奖金池趋势</h3>
    <div class="scroll-x overflow-x-auto">
      <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="h-48 min-w-[480px] w-full" preserveAspectRatio="xMidYMid meet">
        <!-- baseline -->
        <line :x1="pad.l" :y1="chartH - pad.b" :x2="chartW - pad.r" :y2="chartH - pad.b" stroke="rgb(var(--border))" />

        <g v-for="(p, i) in byYear" :key="p.tiNo" class="cursor-pointer" @click="navigateTo(`/ti/${p.routeId}`)">
            <rect
              :x="barX(i)"
              :y="barY(p.prizePoolUsd)"
              :width="barW"
              :height="barH(p.prizePoolUsd)"
              rx="3"
              fill="rgb(var(--gold))"
              :style="{ '--i': i }"
              class="bar-grow opacity-90 transition-opacity hover:opacity-100"
            >
              <title>{{ formatTiLabel(p.tiNo) }} · {{ formatUsd(p.prizePoolUsd) }}</title>
            </rect>
          <!-- value label -->
          <text
            :x="barX(i) + barW / 2"
            :y="barY(p.prizePoolUsd) - 6"
            text-anchor="middle"
            fill="rgb(var(--text-muted))"
            style="font-size: 10px"
          >{{ shortUsd(p.prizePoolUsd) }}</text>
          <!-- year label -->
          <text
            :x="barX(i) + barW / 2"
            :y="chartH - pad.b + 14"
            text-anchor="middle"
            fill="rgb(var(--text-muted))"
            style="font-size: 11px"
          >{{ formatTiLabel(p.tiNo) }}</text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTiLabel, formatUsd } from '~/composables/tiData'
import type { PrizePoolRow } from '~/types/ti'

const props = defineProps<{ prizePools: PrizePoolRow[] }>()

const byYear = computed(() => [...props.prizePools].sort((a, b) => a.tiNo - b.tiNo))

const pad = { l: 16, r: 16, t: 24, b: 24 }
const chartW = 520
const chartH = 200
const innerH = chartH - pad.t - pad.b
const gap = 16

const maxVal = computed(() => Math.max(...byYear.value.map((p) => p.prizePoolUsd), 1))
const slotW = computed(() => (chartW - pad.l - pad.r) / Math.max(byYear.value.length, 1))
const barW = computed(() => Math.min(slotW.value - gap, 56))

function barX(i: number) {
  return pad.l + i * slotW.value + (slotW.value - barW.value) / 2
}
function barY(v: number) {
  return chartH - pad.b - (v / maxVal.value) * innerH
}
function barH(v: number) {
  return (v / maxVal.value) * innerH
}
function shortUsd(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}
</script>
