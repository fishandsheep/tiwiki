<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="inline-block shrink-0"
    v-html="path"
  />
</template>

<script setup lang="ts">
// Minimal inline icon set (lucide-style strokes). Keep small; add only what UI needs.
const PATHS: Record<string, string> = {
  // trophy
  trophy:
    '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>',
  // bar chart
  chart:
    '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
  // map pin
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  // building (venue)
  building:
    '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21v-4h6v4"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>',
  // calendar
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4M16 3v4"/>',
  // dollar (prize)
  dollar: '<path d="M12 2v20"/><path d="M17 6.5C17 4.6 14.8 3 12 3S7 4.6 7 6.5 9.2 10 12 10s5 1.6 5 3.5S14.8 17 12 17s-5-1.6-5-3.5"/>',
  // star (highlight)
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.6l1.2-6L3.3 9.3l6.1-.7L12 3Z"/>',
}

const props = withDefaults(
  defineProps<{ name: keyof typeof PATHS | string; size?: number; strokeWidth?: number }>(),
  { size: 16, strokeWidth: 2 },
)

const path = computed(() => PATHS[props.name] ?? '')
</script>
