<script setup lang="ts">
import type { VNodeChild } from 'vue'
import UiPopover from './UiPopover.vue'
import type { PopoverLocation } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    /**
     * `true` — контент відкривається у popover через слот `trigger`.
     * `false` — контент рендериться на місці (inline), слот `trigger` ігноруються.
     */
    popover?: boolean
    panelClass?: string
    location?: PopoverLocation
  }>(),
  { popover: true, panelClass: '', location: undefined },
)

defineSlots<{
  trigger?: (props: {
    open: boolean
    toggle: () => void
    show: () => void
    hide: () => void
    props: Record<string, unknown>
  }) => VNodeChild
  activator?: (props: {
    open: boolean
    toggle: () => void
    show: () => void
    hide: () => void
    props: Record<string, unknown>
  }) => VNodeChild
  default?: (props: { hide: () => void }) => VNodeChild
  content?: (props: { hide: () => void }) => VNodeChild
}>()

const open = defineModel<boolean>('open', { default: false })

function show() {
  open.value = true
}
function hide() {
  open.value = false
}
function toggle() {
  open.value = !open.value
}
</script>

<template>
  <UiPopover
    v-if="popover"
    v-model="open"
    :content-class="panelClass"
    :location="location"
    :open-on-hover="false"
    :open-on-click="false"
    :interactive="true"
    :eager="false"
  >
    <template #activator="activatorScope">
      <slot
        name="trigger"
        v-bind="activatorScope"
        :open="open"
        :toggle="toggle"
        :show="show"
        :hide="hide"
      >
        <slot
          name="activator"
          v-bind="activatorScope"
          :open="open"
          :toggle="toggle"
          :show="show"
          :hide="hide"
        />
      </slot>
    </template>
    <slot :hide="hide">
      <slot name="content" :hide="hide" />
    </slot>
  </UiPopover>
  <div v-else>
    <slot :hide="hide">
      <slot name="content" :hide="hide" />
    </slot>
  </div>
</template>
