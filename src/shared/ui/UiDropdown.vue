<script setup lang="ts">
import type { VNodeChild } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { DropdownLocation } from '@/shared/model/enums.ts'
import UiButton from './UiButton.vue'
import UiPopover from './UiPopover.vue'

withDefaults(
  defineProps<{
    label?: string
    location?: DropdownLocation
    disabled?: boolean
    contentClass?: string
  }>(),
  {
    label: 'Options',
    location: DropdownLocation.BottomStart,
    disabled: false,
    contentClass: 'w-52 p-2',
  },
)

const open = defineModel<boolean>({ default: false })

function toggle() {
  open.value = !open.value
}

function hide() {
  open.value = false
}

defineSlots<{
  trigger?: (props: {
    props: Record<string, unknown>
    open: boolean
    toggle: () => void
    hide: () => void
  }) => VNodeChild
  default?: (props: { open: boolean; hide: () => void }) => VNodeChild
}>()
</script>

<template>
  <UiPopover
    v-model="open"
    :location="location"
    :disabled="disabled"
    :open-on-hover="false"
    :open-on-click="true"
    :content-class="contentClass"
  >
    <template #activator="{ props, isActive }">
      <slot name="trigger" :props :open="isActive" :toggle :hide>
        <UiButton v-bind="props" :disabled aria-haspopup="menu">
          {{ label }}
          <ChevronDown class="size-4" aria-hidden="true" />
        </UiButton>
      </slot>
    </template>
    <template #menu="{ isActive, hide }">
      <slot :open="isActive" :hide />
    </template>
  </UiPopover>
</template>
