<template>
  <div class="min-h-screen bg-bg-main text-ink-main">
    <NuxtRouteAnnouncer />
    <AppHeader />
    <main class="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <NuxtPage />
    </main>
    <AppFooter />
    <MobileBottomNav />
  </div>
</template>
