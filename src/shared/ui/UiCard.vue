<script setup lang="ts">
withDefaults(defineProps<{ as?: 'div' | 'section' | 'aside'; compact?: boolean }>(), { as: 'div', compact: false })
</script>

<template>
  <component :is="as" class="rounded-brutal-lg border-3 border-ink bg-accent-paper shadow-brutal" :class="compact ? 'p-4' : 'p-5'"><slot /></component>
</template>
