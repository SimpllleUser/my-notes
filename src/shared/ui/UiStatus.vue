<script setup lang="ts">
import { computed } from 'vue'
import { StatusTone } from '@/shared/model/enums.ts'

const props = withDefaults(defineProps<{
  label?: string
  tone: StatusTone
}>(), {
  tone: StatusTone.Success,
})

const dotBg = computed(() => {
  switch (props.tone) {
    case StatusTone.Muted:
      return 'bg-secondary-red'
    default:
      return 'bg-secondary-green'
  }
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5">
    <span
      class="h-3 w-3 rounded-full animate-pulse transition-colors duration-300"
      :class="dotBg"
    />
    <span v-if="label" class="text-xs font-bold text-ink-light">{{ label }}</span>
  </span>
</template>
