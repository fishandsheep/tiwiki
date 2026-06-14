<template>
  <NuxtLink
    :to="to"
    class="card card-hover reveal flex flex-col gap-1 p-4"
  >
    <Icon :name="icon" :size="26" class="text-gold" />
    <span class="mt-1 text-sm font-bold text-ink-main">{{ label }}</span>
    <span class="text-xs text-ink-muted">{{ desc }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string; label: string; icon: string; desc: string }>()
</script>
