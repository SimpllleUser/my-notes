<script setup lang="ts">
import { ref, shallowRef, watch, type Component } from 'vue'
import { resolveLucideIcon } from '@/shared/lib/lucide'
import { UiPopover } from '@/shared/ui'
import { useIconPicker } from '../model/useIconPicker'

withDefaults(defineProps<{ label?: string }>(), { label: 'Обрати іконку' })
const model = defineModel<string | undefined>()
const emit = defineEmits<{ select: [name: string] }>()

const isOpen = ref(false)
const popoverRef = ref<InstanceType<typeof UiPopover> | null>(null)
const { query, results, loading, ensureLoaded } = useIconPicker()
const selectedIcon = shallowRef<Component | null>(null)

watch(() => model.value, async (name) => { selectedIcon.value = await resolveLucideIcon(name) }, { immediate: true })

watch(isOpen, (open) => {
  if (open) {
    query.value = ''
    void ensureLoaded()
  }
})

function select(name: string, component: Component) {
  model.value = name
  selectedIcon.value = component
  emit('select', name)
  isOpen.value = false
}

defineExpose({
  show: () => popoverRef.value?.show(),
  hide: () => popoverRef.value?.hide(),
  toggle: () => popoverRef.value?.toggle(),
})
</script>

<template>
  <UiPopover ref="popoverRef" v-model:open="isOpen" panel-class="w-72">
    <template #trigger="{ toggle, open }">
      <slot name="trigger" :open="open" :toggle="toggle" :icon="selectedIcon">
        <button
          type="button"
          :aria-label="label"
          :title="label"
          class="grid h-10 w-10 place-items-center rounded-brutal border-2 border-ink bg-bg transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
          @click="toggle"
        >
          <component :is="selectedIcon" v-if="selectedIcon" :size="20" />
        </button>
      </slot>
    </template>

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
          class="grid aspect-square place-items-center rounded-lg border-2 border-transparent transition duration-150 hover:border-ink hover:bg-primary-yellow active:scale-90"
          :class="{ 'border-ink bg-primary-yellow': item.name === model }"
          @click="select(item.name, item.component)"
        >
          <component :is="item.component" :size="18" />
        </button>
        <p v-if="results.length === 0" class="col-span-6 py-4 text-center text-sm text-ink-light">Нічого не знайдено</p>
      </template>
    </div>
  </UiPopover>
</template>
