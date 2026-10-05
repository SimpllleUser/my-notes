<script setup lang="ts">
defineProps<{ name: string; count: number; color: string; active?: boolean }>()
</script>

<template>
  <button type="button" class="flex aspect-square flex-col justify-between rounded-brutal border-2 border-ink p-3 text-left transition hover:-translate-y-1" :class="active ? 'bg-ink text-accent-paper shadow-brutal-sm' : 'bg-bg'">
    <span class="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink text-xl" :class="color">▰</span>
    <span><span class="block truncate font-bold">{{ name }}</span><span class="text-xs opacity-70">{{ count }} нотаток</span></span>
  </button>
</template>
