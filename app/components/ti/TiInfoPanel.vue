<template>
  <aside class="reveal lg:sticky lg:top-16">
    <div class="card overflow-hidden">
      <!-- 冠军 -->
      <div class="border-b border-edge bg-gold/5 p-4">
        <p class="text-xs uppercase tracking-wide text-gold">冠军 · Champion</p>
        <p class="mt-1 text-lg font-black text-ink-main">{{ t.champion }}</p>
      </div>
      <!-- 亚军 -->
      <div class="border-b border-edge p-4">
        <p class="text-xs uppercase tracking-wide text-ink-muted">亚军 · Runner-up</p>
        <p class="mt-1 text-base font-bold text-ink-muted">{{ t.runnerUp }}</p>
      </div>

      <dl class="divide-y divide-edge">
        <div v-for="r in rows" :key="r.label" class="flex justify-between gap-3 px-4 py-2.5">
          <dt class="text-sm text-ink-muted">{{ r.label }}</dt>
          <dd class="text-right text-sm font-medium text-ink-main">{{ r.value }}</dd>
        </div>
      </dl>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { formatUsd, formatDateRange } from '~/composables/tiData'
import type { Tournament } from '~/types/ti'

const props = defineProps<{ t: Tournament }>()

const rows = computed(() => [
  { label: '奖金池', value: formatUsd(props.t.prizePoolUsd) },
  { label: '举办地', value: `${props.t.city}，${props.t.country}` },
  { label: '场馆', value: props.t.venue },
  { label: '时间', value: formatDateRange(props.t.startDate, props.t.endDate, props.t.status) },
  { label: '状态', value: props.t.status === 'cancelled' ? '已取消' : '已完赛' },
])
</script>
