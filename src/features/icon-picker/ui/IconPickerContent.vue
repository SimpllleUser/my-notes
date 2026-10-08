<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label: string
    query: string
    results: { name: string; component: Component }[]
    loading: boolean
    modelValue?: string
    autofocus?: boolean
  }>(),
  { autofocus: false },
)

const emit = defineEmits<{
  'update:query': [value: string]
  select: [name: string, component: Component]
}>()
</script>

<template>
  <p class="mb-2 text-xs font-bold uppercase tracking-wider text-ink-light">{{ label }}</p>
  <label
    class="mb-2 flex items-center gap-2 rounded-brutal border-2 border-ink bg-bg px-3 py-2 focus-within:bg-white"
  >
    <span class="text-lg leading-none" aria-hidden="true">⌕</span>
    <input
      :value="query"
      :autofocus="autofocus"
      type="search"
      placeholder="Пошук іконки..."
      class="w-full bg-transparent text-sm outline-none placeholder:text-ink-light"
      @input="emit('update:query', ($event.target as HTMLInputElement).value)"
    />
  </label>

  <div class="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto">
    <p v-if="loading" class="col-span-6 py-4 text-center text-sm text-ink-light">Завантаження…</p>
    <template v-else>
      <button
        v-for="item in results"
        :key="item.name"
        type="button"
        :title="item.name"
        class="grid aspect-square place-items-center rounded-lg border-2 border-transparent transition duration-150 hover:border-ink hover:bg-primary-yellow active:scale-90"
        :class="{ 'border-ink bg-primary-yellow': item.name === modelValue }"
        @click="emit('select', item.name, item.component)"
      >
        <component :is="item.component" :size="18" />
      </button>
      <p v-if="results.length === 0" class="col-span-6 py-4 text-center text-sm text-ink-light">
        Нічого не знайдено
      </p>
    </template>
  </div>
</template>
