<template>
  <div class="mb-4 flex items-baseline justify-between">
    <h2 class="text-lg font-bold text-ink-main sm:text-xl">{{ title }}</h2>
    <NuxtLink v-if="to" :to="to" class="text-xs text-ink-muted transition-colors hover:text-gold">
      查看全部 →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; to?: string }>()
</script>
