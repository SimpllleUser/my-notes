<script setup lang="ts">
import { onMounted } from 'vue'
import { usePickerOpen } from '@/shared/lib/usePickerOpen'
import { UiPicker } from '@/shared/ui'
import { getRandomArrayItem } from '@/shared/utils/arrays.ts'
import { useColorPicker } from '../model/useColorPicker'
import ColorPickerContent from './ColorPickerContent.vue'

const props = withDefaults(
  defineProps<{ label?: string; autoOpen?: boolean; autoInit?: boolean; popover?: boolean }>(),
  {
    label: 'Обрати колір',
    autoOpen: false,
    autoInit: false,
    popover: true,
  },
)
const model = defineModel<string | undefined>()
const emit = defineEmits<{ select: [value: string] }>()

const { open, show, hide, toggle } = usePickerOpen(() => props.popover)
const { swatches } = useColorPicker()

function select(value: string) {
  model.value = value
  emit('select', value)
  hide()
}

onMounted(() => {
  if (props.autoOpen) show()
  if (!model.value && props.autoInit) select(getRandomArrayItem(swatches).class)
})

defineExpose({ show, hide, toggle })
</script>

<template>
  <UiPicker v-model:open="open" :popover="popover" panel-class="w-56">
    <template #trigger="triggerProps">
      <slot name="trigger" v-bind="triggerProps" :value="model">
        <button
          type="button"
          :aria-label="label"
          :title="label"
          class="grid h-10 w-10 place-items-center rounded-brutal border-2 border-ink transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
          :class="model ?? 'bg-bg'"
          @click="triggerProps.toggle"
        />
      </slot>
    </template>

    <ColorPickerContent :label :swatches :model-value="model" @select="select" />
  </UiPicker>
</template>
