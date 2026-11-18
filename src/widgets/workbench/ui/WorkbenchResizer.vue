<script setup lang="ts">
defineOptions({ name: 'WorkbenchResizer' })

const KEYBOARD_STEP_PX = 24

const emit = defineEmits<{ resize: [deltaPx: number] }>()

let lastX = 0

function onPointerDown(event: PointerEvent) {
  lastX = event.clientX
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!(event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) return
  emit('resize', event.clientX - lastX)
  lastX = event.clientX
}

function onKeydown(event: KeyboardEvent) {
  const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key]
  if (!direction) return
  event.preventDefault()
  emit('resize', direction * KEYBOARD_STEP_PX)
}
</script>

<template>
  <!-- Лише на md+: на мобільному групи стекаються вертикально з рівною висотою. -->
  <div
    role="separator"
    aria-orientation="vertical"
    aria-label="Змінити ширину груп"
    tabindex="0"
    class="group/resizer relative hidden w-px shrink-0 cursor-col-resize touch-none bg-base-300 transition-colors hover:bg-primary focus-visible:bg-primary active:bg-primary md:block"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @keydown="onKeydown"
  >
    <!-- Ширша зона захоплення, ніж видима лінія -->
    <span class="absolute inset-y-0 -left-1 w-3" />
  </div>
</template>
