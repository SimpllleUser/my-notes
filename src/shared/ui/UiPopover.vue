<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ align?: 'left' | 'right' | 'top' | 'bottom'; panelClass?: string }>(), {
  align: 'right',
  panelClass: '',
})

const positionClass = computed(() => {
  switch (props.align) {
    case 'left':
      return 'left-0 top-full mt-2'
    case 'top':
      return 'left-0 bottom-full mb-2'
    case 'bottom':
      return 'left-0 top-full mt-2'
    default:
      return 'right-0 top-full mt-2'
  }
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
      class="absolute z-20 max-w-[calc(100vw-2rem)] rounded-brutal border-3 border-ink bg-accent-paper p-3 shadow-brutal"
      :class="[positionClass, panelClass]"
    >
      <slot :hide="hide" />
    </div>
  </div>
</template>
