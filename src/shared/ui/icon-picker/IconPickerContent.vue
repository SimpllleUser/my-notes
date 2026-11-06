<script setup lang="ts">
import type { Component } from 'vue'
import { Search } from '@lucide/vue'
import { InputType } from '@/shared/model/enums.ts'
import UIInputField from '../UIInputField.vue'

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
  <h3 class="mb-2 text-sm font-semibold">{{ label }}</h3>
  <UIInputField
    :model-value="query"
    :type="InputType.Search"
    :autofocus="autofocus"
    placeholder="Пошук іконки..."
    class="mb-2"
    @update:model-value="emit('update:query', $event)"
  >
    <template #prefix><Search :size="16" class="opacity-70" aria-hidden="true" /></template>
  </UIInputField>

  <div class="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto">
    <div v-if="loading" class="col-span-6 flex justify-center py-4">
      <span class="loading loading-spinner loading-md" aria-label="Завантаження" />
    </div>
    <template v-else>
      <button
        v-for="item in results"
        :key="item.name"
        type="button"
        :title="item.name"
        class="btn btn-square btn-ghost btn-sm aspect-square"
        :class="{ 'btn-primary': item.name === modelValue }"
        @click="emit('select', item.name, item.component)"
      >
        <component :is="item.component" :size="18" />
      </button>
      <div v-if="results.length === 0" class="alert alert-info col-span-6 text-sm">
        Нічого не знайдено
      </div>
    </template>
  </div>
</template>
