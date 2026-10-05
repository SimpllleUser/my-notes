<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch, type Component } from 'vue'
import { resolveLucideIcon } from '@/shared/lib/lucide'
import { useIconPicker } from '../model/useIconPicker'

withDefaults(defineProps<{ label?: string }>(), { label: 'Обрати іконку' })
const model = defineModel<string | undefined>()
const emit = defineEmits<{ select: [name: string] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const { query, results, loading, ensureLoaded } = useIconPicker()
const selectedIcon = shallowRef<Component | null>(null)

watch(() => model.value, async (name) => { selectedIcon.value = await resolveLucideIcon(name) }, { immediate: true })

function toggle() {
  open.value = !open.value
  if (open.value) {
    query.value = ''
    void ensureLoaded()
  }
}

function select(name: string, component: Component) {
  model.value = name
  selectedIcon.value = component
  emit('select', name)
  open.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target as Node)) open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('mousedown', handleClickOutside)
  else document.removeEventListener('mousedown', handleClickOutside)
})
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="rootRef" class="relative inline-block">
    <slot name="trigger" :open="open" :toggle="toggle" :icon="selectedIcon">
      <button
        type="button"
        :aria-label="label"
        :title="label"
        class="grid h-10 w-10 place-items-center rounded-brutal border-2 border-ink bg-bg transition hover:-translate-y-0.5"
        @click="toggle"
      >
        <component :is="selectedIcon" v-if="selectedIcon" :size="20" />
      </button>
    </slot>

    <div
      v-if="open"
      class="absolute right-0 z-20 mt-2 w-72 rounded-brutal border-3 border-ink bg-accent-paper p-3 shadow-brutal"
    >
      <label class="mb-2 flex items-center gap-2 rounded-brutal border-2 border-ink bg-bg px-3 py-2 focus-within:bg-white">
        <span class="text-lg leading-none" aria-hidden="true">⌕</span>
        <input
          v-model="query"
          type="search"
          autofocus
          placeholder="Пошук іконки..."
          class="w-full bg-transparent text-sm outline-none placeholder:text-ink-light"
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
            class="grid aspect-square place-items-center rounded-lg border-2 border-transparent transition hover:border-ink hover:bg-primary-yellow"
            :class="{ 'border-ink bg-primary-yellow': item.name === model }"
            @click="select(item.name, item.component)"
          >
            <component :is="item.component" :size="18" />
          </button>
          <p v-if="results.length === 0" class="col-span-6 py-4 text-center text-sm text-ink-light">Нічого не знайдено</p>
        </template>
      </div>
    </div>
  </div>
</template>
