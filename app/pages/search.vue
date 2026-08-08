<template>
  <div class="mx-auto max-w-shell px-4 py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-black text-ink-main sm:text-3xl">全站搜索</h1>
      <p class="mt-1 text-sm text-ink-muted">搜索赛事、年份、战队、选手及历史别名。搜索在本地完成，不上传关键词。</p>
    </header>

    <label class="relative block">
      <span class="sr-only">搜索 Ti 百科</span>
      <Icon name="search" :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        ref="inputEl"
        @input="handleInput"
        type="search"
        inputmode="search"
        enterkeyhint="search"
        autocomplete="off"
        class="min-h-12 w-full rounded-lg border border-edge bg-bg-card py-3 pl-10 pr-4 text-sm text-ink-main focus:border-gold/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        placeholder="例如：Ti6、Wings、Ame、2018…"
      >
    </label>

    <p aria-live="polite" class="mt-3 text-xs text-ink-muted">
      <template v-if="needle">找到 {{ results.length }} 条结果</template>
      <template v-else>输入关键词开始搜索</template>
    </p>

    <div v-if="needle && !results.length" class="card mt-5 p-8 text-center text-sm text-ink-muted">没有匹配结果。</div>
    <ul v-else class="mt-5 grid gap-3 sm:grid-cols-2">
      <li v-for="entry in results" :key="entry.id">
        <NuxtLink :to="entry.href" class="card card-hover block min-h-24 p-4">
          <span class="chip">{{ kindLabel[entry.kind] }}</span>
          <h2 class="mt-2 font-bold text-ink-main">{{ entry.label }}</h2>
          <p class="mt-1 text-sm text-ink-muted">{{ entry.description }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { SearchEntry } from '~~/shared/types/ti'

const { data: index } = useAsyncData<SearchEntry[]>('static-search-index', () => $fetch('/search-index.json'), {
  default: () => [],
  server: false,
})
const query = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const needle = computed(() => query.value.trim().toLowerCase())
const results = computed(() => {
  if (!needle.value) return []
  return index.value
    .filter((entry) => `${entry.label} ${entry.description} ${entry.keywords}`.toLowerCase().includes(needle.value))
    .slice(0, 60)
})
const kindLabel = { tournament: '赛事', team: '战队', player: '选手' } as const

function handleInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
}

onMounted(() => inputEl.value?.focus())
onMounted(() => {
  // Preserve keystrokes entered before Nuxt hydration finishes.
  if (inputEl.value?.value) query.value = inputEl.value.value
})
usePageSeo('全站搜索 — Ti百科', '搜索 Ti 历届赛事、战队、选手与历史别名。', '/search')
</script>
