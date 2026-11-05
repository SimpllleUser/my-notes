<script setup lang="ts">
import { onMounted } from 'vue'
import { usePickerOpen } from '@/shared/lib/usePickerOpen'
import { UiIconButton, UiPicker } from '@/shared/ui'
import { ButtonColor, ButtonVariant, PopoverLocation } from '@/shared/model/enums.ts'
import { getRandomArrayItem } from '@/shared/utils/arrays.ts'
import { useColorPicker } from '../model/useColorPicker'
import ColorPickerContent from './ColorPickerContent.vue'

const props = withDefaults(
  defineProps<{
    label?: string
    autoOpen?: boolean
    autoInit?: boolean
    popover?: boolean
    compact?: boolean
    location?: PopoverLocation
  }>(),
  {
    label: 'Обрати колір',
    autoOpen: false,
    autoInit: false,
    popover: true,
    compact: false,
    location: PopoverLocation.BottomEnd,
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
  <UiPicker
    v-model:open="open"
    :popover="popover"
    :location="location"
    :panel-class="compact ? 'w-36 !p-2' : 'w-56'"
  >
    <template #trigger="triggerProps">
      <slot name="trigger" v-bind="triggerProps" :value="model">
        <UiIconButton
          :label="label"
          :variant="ButtonVariant.Outlined"
          :color="ButtonColor.Neutral"
          @click="triggerProps.toggle"
        >
          <span class="size-6 rounded" :class="model ?? 'bg-base-200'" />
        </UiIconButton>
      </slot>
    </template>

    <ColorPickerContent :label :swatches :model-value="model" :compact @select="select" />
  </UiPicker>
</template>
