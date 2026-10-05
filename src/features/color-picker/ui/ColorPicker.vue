<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useColorPicker } from '../model/useColorPicker'

const props = withDefaults(defineProps<{ label?: string; autoOpen?: boolean }>(), { label: 'Обрати колір', autoOpen: false })
const model = defineModel<string | undefined>()
const emit = defineEmits<{ select: [value: string] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const { swatches } = useColorPicker()

function toggle() {
  open.value = !open.value
}

function select(value: string) {
  model.value = value
  emit('select', value)
  open.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target as globalThis.Node)) open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('mousedown', handleClickOutside)
  else document.removeEventListener('mousedown', handleClickOutside)
})
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
onMounted(() => {
  if (props.autoOpen) open.value = true
})
</script>

<template>
  <div ref="rootRef" class="relative inline-block">
    <slot name="trigger" :open="open" :toggle="toggle" :value="model">
      <button
        type="button"
        :aria-label="label"
        :title="label"
        class="grid h-10 w-10 place-items-center rounded-brutal border-2 border-ink transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
        :class="model ?? 'bg-bg'"
        @click="toggle"
      />
    </slot>

    <div
      v-if="open"
      class="absolute right-0 z-20 mt-2 w-56 rounded-brutal border-3 border-ink bg-accent-paper p-3 shadow-brutal"
    >
      <p class="mb-2 text-xs font-bold uppercase tracking-wider text-ink-light">{{ label }}</p>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="swatch in swatches"
          :key="swatch.class"
          type="button"
          :title="swatch.name"
          class="aspect-square rounded-lg border-2 transition duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-90"
          :class="[swatch.class, swatch.class === model ? 'border-ink' : 'border-transparent']"
          @click="select(swatch.class)"
        />
      </div>
    </div>
  </div>
</template>
