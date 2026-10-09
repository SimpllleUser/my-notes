<script setup lang="ts">
defineProps<{ placeholder?: string }>()
const value = defineModel<string>({ default: '' })
</script>

<template>
  <label
    class="flex items-center gap-2 rounded-brutal border-2 border-ink bg-bg px-3 py-2 shadow-brutal-sm transition duration-150 hover:shadow-brutal focus-within:bg-accent-paper focus-within:shadow-brutal"
  >
    <span class="text-lg leading-none" aria-hidden="true">⌕</span>
    <input
      v-model="value"
      class="w-full bg-transparent text-base outline-none sm:text-sm placeholder:text-ink-light"
      :placeholder="placeholder"
      type="search"
    />
  </label>
</template>
