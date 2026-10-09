<script setup lang="ts">
import UiPopover from './UiPopover.vue'

withDefaults(
  defineProps<{
    /**
     * `true` — контент відкривається у popover через слот `trigger`.
     * `false` — контент рендериться на місці (inline), слот `trigger` ігноруються.
     */
    popover?: boolean
    panelClass?: string
  }>(),
  { popover: true, panelClass: '' },
)

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
    :open-on-hover="false"
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
      />
    </template>
    <slot :hide="hide" />
  </UiPopover>
  <div v-else>
    <slot />
  </div>
</template>
