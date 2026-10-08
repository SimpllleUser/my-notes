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

function hide() {
  open.value = false
}
</script>

<template>
  <UiPopover v-if="popover" v-model:open="open" :panel-class="panelClass">
    <template #trigger="triggerProps">
      <slot name="trigger" v-bind="triggerProps" />
    </template>
    <slot :hide="hide" />
  </UiPopover>
  <div v-else>
    <slot />
  </div>
</template>
