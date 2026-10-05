<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

withDefaults(defineProps<{ align?: 'left' | 'right'; panelClass?: string }>(), {
  align: 'right',
  panelClass: '',
})

const open = defineModel<boolean>('open', { default: false })

const rootRef = ref<HTMLElement | null>(null)

function show() {
  open.value = true
}
function hide() {
  open.value = false
}
function toggle() {
  open.value = !open.value
}

function handleClickOutside(event: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target as globalThis.Node)) {
    hide()
  }
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('mousedown', handleClickOutside)
  else document.removeEventListener('mousedown', handleClickOutside)
})
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

defineExpose({ open, show, hide, toggle })
</script>

<template>
  <div ref="rootRef" class="relative inline-block">
    <slot name="trigger" :open="open" :toggle="toggle" :show="show" :hide="hide" />

    <div
      v-if="open"
      class="absolute z-20 mt-2 rounded-brutal border-3 border-ink bg-accent-paper p-3 shadow-brutal"
      :class="[align === 'right' ? 'right-0' : 'left-0', panelClass]"
    >
      <slot :hide="hide" />
    </div>
  </div>
</template>
