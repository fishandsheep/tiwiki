<template>
  <div class="min-h-screen bg-bg-main text-ink-main">
    <NuxtRouteAnnouncer />
    <a v-if="!isAdminRoute" href="#main-content" class="skip-link">跳到主要内容</a>
    <AppHeader v-if="!isAdminRoute" />
    <main id="main-content" tabindex="-1" :class="isAdminRoute ? '' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0'">
      <NuxtPage />
    </main>
    <AppFooter v-if="!isAdminRoute" />
    <MobileBottomNav v-if="!isAdminRoute" />
    <MediaZoomOverlay v-if="!isAdminRoute" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
</script>
