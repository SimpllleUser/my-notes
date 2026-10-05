<script setup lang="ts">
import { shallowRef, watch, type Component } from 'vue'
import { resolveLucideIcon } from '@/shared/lib/lucide'

const props = defineProps<{ name: string; count: number; color: string; icon?: string; active?: boolean }>()

const iconComponent = shallowRef<Component | null>(null)

watch(
  () => props.icon,
  async (icon) => {
    iconComponent.value = await resolveLucideIcon(icon)
  },
  { immediate: true },
)
</script>

<template>
  <button type="button" class="flex aspect-square flex-col justify-between rounded-brutal border-2 border-ink p-3 text-left transition duration-150 hover:-translate-y-1 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none" :class="active ? 'bg-ink text-accent-paper shadow-brutal-sm' : 'bg-bg'">
    <span class="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink" :class="color">
      <component :is="iconComponent" v-if="iconComponent" :size="20" />
    </span>
    <span><span class="block truncate font-bold">{{ name }}</span><span class="text-xs opacity-70">{{ count }} нотаток</span></span>
  </button>
</template>
