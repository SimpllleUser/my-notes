<script setup lang="ts">
defineProps<{ placeholder?: string }>()
const value = defineModel<string>({ default: '' })
</script>

<template>
  <label class="flex items-center gap-2 rounded-brutal border-2 border-ink bg-bg px-3 py-2 focus-within:bg-white">
    <span class="text-lg leading-none" aria-hidden="true">⌕</span>
    <input v-model="value" class="w-full bg-transparent text-sm outline-none placeholder:text-ink-light" :placeholder="placeholder" type="search" />
  </label>
</template>
