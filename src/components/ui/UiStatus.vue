<script setup lang="ts">
withDefaults(defineProps<{ label: string; tone?: 'success' | 'muted' }>(), { tone: 'success' })
</script>

<template>
  <span class="inline-flex items-center gap-2 text-xs font-bold text-ink-light"><span class="h-2 w-2 rounded-full" :class="tone === 'success' ? 'bg-secondary-green' : 'bg-ink-light'" />{{ label }}</span>
</template>
