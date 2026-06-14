<template>
  <div class="card reveal p-4">
    <p class="text-xs text-ink-muted">{{ label }}</p>
    <p class="mt-1 text-xl font-black text-ink-main sm:text-2xl">
      {{ value }}<span v-if="suffix" class="ml-0.5 text-sm font-medium text-ink-muted">{{ suffix }}</span>
    </p>
    <p v-if="sub" class="mt-0.5 text-xs text-gold/80">{{ sub }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string; suffix?: string; sub?: string }>()
</script>
