<script setup lang="ts">
import type { ColorSwatch } from '../model/useColorPicker'

defineProps<{
  label: string
  swatches: ColorSwatch[]
  modelValue?: string
}>()

const emit = defineEmits<{ select: [value: string] }>()
</script>

<template>
  <p class="mb-2 text-xs font-bold uppercase tracking-wider text-ink-light">{{ label }}</p>
  <div class="grid grid-cols-4 gap-2">
    <button
      v-for="swatch in swatches"
      :key="swatch.class"
      type="button"
      :title="swatch.name"
      class="aspect-square rounded-lg border-2 transition duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-90"
      :class="[swatch.class, swatch.class === modelValue ? 'border-ink' : 'border-transparent']"
      @click="emit('select', swatch.class)"
    />
  </div>
</template>
