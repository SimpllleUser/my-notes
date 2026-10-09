<script setup lang="ts">
import { StatusTone } from '@/shared/model/enums.ts'

withDefaults(defineProps<{ label: string; tone?: StatusTone }>(), { tone: StatusTone.Success })
</script>

<template>
  <span class="inline-flex items-center gap-2 text-xs font-bold text-ink-light"
    ><span
      class="h-2 w-2 rounded-full"
      :class="tone === StatusTone.Success ? 'bg-secondary-green' : 'bg-ink-light'"
    />{{ label }}</span
  >
</template>
