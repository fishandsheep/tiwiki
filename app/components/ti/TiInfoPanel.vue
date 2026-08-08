<template>
  <aside class="reveal lg:sticky lg:top-16">
    <div class="card overflow-hidden">
      <!-- 冠军 -->
      <div class="border-b border-edge bg-gold/5 px-3.5 py-3 lg:p-5">
        <p class="text-xs uppercase tracking-wide text-gold lg:text-sm">冠军 · Champion</p>
        <button
          v-if="t.championTeamId"
          type="button"
          class="mt-1 inline-flex min-h-11 items-center text-left text-[1.05rem] font-black leading-tight text-ink-main transition-colors hover:text-gold lg:text-xl"
          @click="emit('focus-team', t.championTeamId)"
        >
          {{ t.champion }}
        </button>
        <p v-else class="mt-1 text-[1.05rem] font-black leading-tight text-ink-main lg:text-xl">{{ t.champion }}</p>
        <a v-if="sourceFor('champion_team_id')" :href="sourceFor('champion_team_id')?.sourceUrl" target="_blank" rel="noreferrer" class="mt-1 block text-[11px] text-ink-muted hover:text-gold">
          来源 {{ sourceLabel(sourceFor('champion_team_id')!.sourceKind) }}<template v-if="sourceFor('champion_team_id')?.sourceRevision"> · rev {{ sourceFor('champion_team_id')?.sourceRevision }}</template>
        </a>
      </div>
      <!-- 亚军 -->
      <div class="border-b border-edge px-3.5 py-3 lg:p-5">
        <p class="text-xs uppercase tracking-wide text-ink-muted lg:text-sm">亚军 · Runner-up</p>
        <p class="mt-1 text-base font-bold text-ink-muted lg:text-lg">{{ t.runnerUp }}</p>
        <a v-if="sourceFor('runner_up_team_id')" :href="sourceFor('runner_up_team_id')?.sourceUrl" target="_blank" rel="noreferrer" class="mt-1 block text-[11px] text-ink-muted hover:text-gold">
          来源 {{ sourceLabel(sourceFor('runner_up_team_id')!.sourceKind) }}<template v-if="sourceFor('runner_up_team_id')?.sourceRevision"> · rev {{ sourceFor('runner_up_team_id')?.sourceRevision }}</template>
        </a>
      </div>

      <dl class="divide-y divide-edge">
        <div v-for="r in rows" :key="r.label" class="relative grid grid-cols-[4.25rem_1fr] items-start gap-2 px-3.5 py-2.5 lg:px-5 lg:py-4">
          <dt class="text-sm text-ink-muted lg:text-base">{{ r.label }}</dt>
          <dd class="min-w-0 break-words pr-5 text-sm font-medium text-ink-main text-right lg:text-base">
            <a
              v-if="r.href"
              :href="r.href"
              target="_blank"
              rel="noreferrer"
              class="wiki-link-icon absolute right-3 top-2.5 lg:right-5 lg:top-4"
              :aria-label="`${r.label}：打开来源页面`"
            >
              <Icon name="external" :size="12" />
            </a>
            <span>{{ r.value }}</span>
            <span v-if="r.source" class="mt-1 block text-[11px] font-normal text-ink-muted">
              来源 {{ sourceLabel(r.source.sourceKind) }}<template v-if="r.source.sourceRevision"> · rev {{ r.source.sourceRevision }}</template>
            </span>
          </dd>
        </div>
      </dl>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { formatUsd, formatDateRange } from '~/composables/tiData'
import type { Tournament } from '~/types/ti'
import type { FieldProvenance } from '~/types/ti'

const props = defineProps<{ t: Tournament }>()
const emit = defineEmits<{ 'focus-team': [teamId: string] }>()

function sourceFor(fieldName: string) {
  const priority = { official: 0, curated: 1, liquipedia: 2, wikipedia: 3 }
  return props.t.provenance
    .filter((source) => source.fieldName === fieldName)
    .sort((a, b) => priority[a.sourceKind] - priority[b.sourceKind])[0]
}

function sourceLabel(kind: FieldProvenance['sourceKind']) {
  return { official: '官方', liquipedia: 'Liquipedia', wikipedia: 'Wikipedia', curated: '人工校对' }[kind]
}

const rows = computed(() => [
  { label: '奖金池', value: formatUsd(props.t.prizePoolUsd, props.t.status), source: sourceFor('prize_pool_usd'), href: sourceFor('prize_pool_usd')?.sourceUrl || '' },
  { label: '举办地', value: `${props.t.city}，${props.t.country}`, source: sourceFor('city') || sourceFor('country'), href: (sourceFor('city') || sourceFor('country'))?.sourceUrl || '' },
  { label: '场馆', value: props.t.venue, source: sourceFor('venue'), href: sourceFor('venue')?.sourceUrl || '' },
  { label: '时间', value: formatDateRange(props.t.startDate, props.t.endDate, props.t.status), source: sourceFor('start_date'), href: sourceFor('start_date')?.sourceUrl || '' },
  { label: '状态', value: props.t.status === 'cancelled' ? '已取消' : props.t.status === 'ongoing' ? '进行中' : '已完赛' },
  { label: '数据截至', value: props.t.fetchedAt ? new Date(props.t.fetchedAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '待核验' },
  { label: '核验状态', value: props.t.verificationStatus === 'verified' ? '双源已核验' : props.t.verificationStatus === 'pending' ? '待核验' : '单一来源' },
  { label: '英文页', value: props.t.liquipediaUrl ? 'Liquipedia' : '—', href: props.t.liquipediaUrl || '', source: undefined },
])
</script>
