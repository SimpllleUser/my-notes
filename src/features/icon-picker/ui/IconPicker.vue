<script setup lang="ts">
import { onMounted, shallowRef, watch, type Component } from 'vue'
import { resolveLucideIcon } from '@/shared/lib/lucide'
import { usePickerOpen } from '@/shared/lib/usePickerOpen'
import { UiPicker } from '@/shared/ui'
import { useIconPicker } from '../model/useIconPicker'
import IconPickerContent from './IconPickerContent.vue'

const props = withDefaults(
  defineProps<{ label?: string; autoInit?: boolean; popover?: boolean }>(),
  {
    label: 'Обрати іконку',
    autoInit: false,
    popover: true,
  },
)
const model = defineModel<string | undefined>()
const emit = defineEmits<{ select: [name: string] }>()

const { open, show, hide, toggle } = usePickerOpen(() => props.popover)
const { query, results, loading, ensureLoaded, getRandomIcon } = useIconPicker()
const selectedIcon = shallowRef<Component | null>(null)

watch(
  () => model.value,
  async (name) => {
    selectedIcon.value = await resolveLucideIcon(name)
  },
  { immediate: true },
)

// Ліниве завантаження: щойно пікер стає видимим (popover відкрито) або одразу в inline-режимі.
watch(
  open,
  (visible) => {
    if (!visible) return
    query.value = ''
    void ensureLoaded()
  },
  { immediate: true },
)

function select(name: string, component: Component) {
  model.value = name
  selectedIcon.value = component
  emit('select', name)
  hide()
}

onMounted(async () => {
  if (!props.autoInit || model.value) return
  const icon = await getRandomIcon()
  select(icon.name, icon.component)
})

defineExpose({ show, hide, toggle })
</script>

<template>
  <UiPicker v-model:open="open" :popover="popover" panel-class="w-72">
    <template #trigger="triggerProps">
      <slot name="trigger" v-bind="triggerProps" :icon="selectedIcon">
        <button
          type="button"
          :aria-label="label"
          :title="label"
          class="grid h-10 w-10 place-items-center rounded-brutal border-2 border-ink bg-bg transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
          @click="triggerProps.toggle"
        >
          <component :is="selectedIcon" v-if="selectedIcon" :size="20" />
        </button>
      </slot>
    </template>

    <IconPickerContent
      v-model:query="query"
      :label
      :results
      :loading
      :model-value="model"
      :autofocus="popover"
      @select="select"
    />
  </UiPicker>
</template>
