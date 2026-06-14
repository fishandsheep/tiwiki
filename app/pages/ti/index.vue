<template>
  <div class="mx-auto max-w-shell px-4 py-8">
    <header v-reveal class="reveal mb-6">
      <h1 class="text-2xl font-black text-ink-main sm:text-3xl">历届赛事</h1>
      <p class="mt-1 text-sm text-ink-muted">Dota2 国际邀请赛 ti 1 到 ti {{ maxNo }}</p>
    </header>

    <!-- 搜索 -->
    <div class="mb-6">
      <label class="relative block">
        <span class="sr-only">搜索 ti / 战队</span>
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
          <Icon name="pin" :size="16" />
        </span>
        <input
          ref="inputEl"
          v-model="q"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          spellcheck="false"
          maxlength="60"
          placeholder="搜索届号 / 年份 / 冠军 / 战队…"
          class="w-full rounded-lg border border-edge bg-bg-card py-2.5 pl-9 pr-16 text-sm text-ink-main placeholder:text-ink-muted/70 transition-colors focus:border-gold/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40"
          @keydown.esc.prevent="clear"
        />
        <button
          v-if="q"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-ink-muted transition-colors hover:text-gold"
          aria-label="清空搜索"
          @click="clear"
        >清空</button>
      </label>
      <p class="mt-2 text-xs text-ink-muted">
        <template v-if="q">匹配 {{ filtered.length }} / {{ tournaments.length }} 届 · 按 <kbd class="rounded border border-edge px-1 font-mono">/</kbd> 聚焦</template>
        <template v-else>共 {{ tournaments.length }} 届 · 按 <kbd class="rounded border border-edge px-1 font-mono">/</kbd> 快速搜索</template>
      </p>
    </div>

    <!-- 空结果 -->
    <div v-if="!filtered.length" class="card p-10 text-center">
      <p class="text-sm text-ink-muted">未找到匹配「{{ q }}」的赛事。</p>
      <button
        type="button"
        class="mt-3 rounded-lg border border-edge px-3 py-1.5 text-sm text-ink-main transition-colors hover:border-gold/60"
        @click="clear"
      >清空搜索</button>
    </div>

    <!-- 列表 -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TiCard
        v-for="(t, i) in filtered"
        :key="t.id"
        v-reveal
        :style="{ '--i': Math.min(i, 6) }"
        :tournament="t"
        :best-china-rank="t.bestChinaRank"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: tournaments } = await useTournaments()
const maxNo = computed(() => {
  const completed = tournaments.value.filter((t) => t.status === 'completed')
  return completed.length ? completed[0].tiNo : 14
})

const q = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

// 可搜文本:届号 + 年份 + 中英文名 + 冠/亚军 + 参赛队名
const haystack = computed(() => {
  return new Map(
    tournaments.value.map((t) => {
      const teams = t.participantTeamNames.join(' ')
      return [
        t.id,
        [t.tiNo, t.year, t.name, t.nameZh, t.champion, t.runnerUp, teams]
          .join(' ')
          .toLowerCase(),
      ]
    }),
  )
})

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return tournaments.value
  return tournaments.value.filter((t) => haystack.value.get(t.id)?.includes(needle))
})

function clear() {
  q.value = ''
  inputEl.value?.focus()
}

// `/` 快捷聚焦(power user)。忽略输入态 / 元素内。
function onKeydown(e: KeyboardEvent) {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
  const el = e.target as HTMLElement
  if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
  e.preventDefault()
  inputEl.value?.focus()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

useHead({ title: '历届赛事 — ti 百科' })
</script>
