<template>
  <div class="min-h-screen bg-bg-main text-ink-main">
    <AppHeader />
    <main class="mx-auto max-w-shell px-4 py-16 pb-28 lg:pb-16">
      <div class="card max-w-xl p-8">
        <p class="font-mono text-sm text-gold">HTTP {{ error?.statusCode || 500 }}</p>
        <h1 class="mt-2 text-2xl font-black text-ink-main sm:text-3xl">
          {{ isNotFound ? '这页还没收录' : '出了一点问题' }}
        </h1>
        <p class="mt-3 text-sm leading-relaxed text-ink-muted">
          {{ isNotFound
            ? '你访问的 ti 页面不存在，或链接有误。可从下方已收录届次重新进入。'
            : '服务器或页面渲染遇到异常。可返回首页重试。'
          }}
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <NuxtLink to="/" class="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-bg-main transition-opacity hover:opacity-90">
            返回首页
          </NuxtLink>
          <NuxtLink to="/ti" class="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-ink-main transition-colors hover:border-gold/60">
            历届赛事
          </NuxtLink>
        </div>

        <div v-if="isNotFound && tournaments.length" class="mt-8">
          <p class="mb-2 text-xs uppercase tracking-wide text-ink-muted">已收录</p>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="t in tournaments"
              :key="t.id"
              :to="`/ti/${t.routeId}`"
              class="chip transition-colors hover:border-gold/60"
            >
              {{ t.status === 'cancelled' ? t.year : formatTiLabel(t.tiNo) }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
    <MobileBottomNav />
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { formatTiLabel } from '~/composables/tiData'

const props = defineProps<{ error: NuxtError }>()
const isNotFound = computed(() => props.error?.statusCode === 404)

const { data: tournaments } = await useTournaments()

useHead({ title: `${isNotFound.value ? '未收录' : '出错了'} — ti 百科` })
</script>
