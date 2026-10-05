<script setup lang="ts">
defineProps<{ title: string; preview: string; updated: string; active?: boolean }>()
</script>

<template>
  <button type="button" class="w-full rounded-brutal border-2 border-ink p-3 text-left transition hover:-translate-y-0.5" :class="active ? 'bg-secondary-blue text-white shadow-brutal-sm' : 'bg-bg'">
    <div class="flex items-start justify-between gap-3"><h3 class="font-black">{{ title }}</h3><span class="shrink-0 text-[11px] opacity-70">{{ updated }}</span></div>
    <p class="mt-2 line-clamp-2 text-sm leading-5 opacity-75">{{ preview }}</p>
  </button>
</template>
