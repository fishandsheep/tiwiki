<template>
  <header
    class="sticky top-0 z-40 border-b border-edge bg-bg-main/85 backdrop-blur-md"
  >
    <div class="mx-auto flex h-14 max-w-shell items-center gap-4 px-4">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span
          class="ti-wordmark grid h-8 w-8 place-items-center rounded-md bg-gold text-sm text-bg-main"
          >ti</span
        >
        <span class="text-base font-bold tracking-wide text-ink-main"
          ><span class="ti-wordmark text-lg">ti</span> 百科</span
        >
      </NuxtLink>

      <nav class="ml-auto hidden items-center gap-5 text-sm lg:flex">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="text-ink-muted transition-colors hover:text-gold"
          active-class="!text-gold"
          >{{ l.label }}</NuxtLink
        >
      </nav>

      <div class="ml-auto lg:hidden" />
    </div>
  </header>
</template>

<script setup lang="ts">
const links = [
  { to: '/ti', label: '历届赛事' },
  { to: '/china', label: '中国战队' },
  { to: '/rankings', label: '榜单' },
]
</script>
