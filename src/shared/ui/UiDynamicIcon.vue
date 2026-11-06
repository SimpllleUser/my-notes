<script setup lang="ts">
import { shallowRef, watch, type Component } from 'vue'
import { resolveLucideIcon } from '@/shared/lib/lucide'

const props = withDefaults(
  defineProps<{
    name?: string | null
    fallback?: string
    size?: number | string
    strokeWidth?: number | string
  }>(),
  {
    fallback: 'Folder',
    size: 24,
    strokeWidth: 2,
  },
)

const icon = shallowRef<Component | null>(null)
let requestId = 0

watch(
  () => [props.name, props.fallback] as const,
  async ([name, fallback]) => {
    const currentRequest = ++requestId
    const resolved = await resolveLucideIcon(name ?? undefined, fallback)
    if (currentRequest === requestId) icon.value = resolved
  },
  { immediate: true },
)
</script>

<template>
  <component
    :is="icon"
    v-if="icon"
    :size="size"
    :stroke-width="strokeWidth"
    aria-hidden="true"
  />
</template>
