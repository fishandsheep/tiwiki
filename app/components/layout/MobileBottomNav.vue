<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
  >
    <div class="mx-auto grid max-w-shell grid-cols-3">
      <NuxtLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] text-ink-muted transition-colors hover:text-gold"
        active-class="!text-gold"
      >
        <Icon :name="l.icon" :size="20" />
        <span>{{ l.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const links = [
  { to: '/ti', label: '赛事', icon: 'trophy' },
  { to: '/china', label: '中国战队', icon: 'pin' },
  { to: '/rankings', label: '榜单', icon: 'chart' },
]
</script>
