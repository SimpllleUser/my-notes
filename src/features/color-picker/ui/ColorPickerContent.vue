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
  <h3 class="mb-2 text-sm font-semibold">{{ label }}</h3>
  <div class="grid grid-cols-4 gap-2">
    <button
      v-for="swatch in swatches"
      :key="swatch.class"
      type="button"
      :title="swatch.name"
      class="btn btn-circle btn-sm border border-base-content/20"
      :class="[
        swatch.class,
        { 'btn-active ring-2 ring-base-content ring-offset-2': swatch.class === modelValue },
      ]"
      @click="emit('select', swatch.class)"
    />
  </div>
</template>
