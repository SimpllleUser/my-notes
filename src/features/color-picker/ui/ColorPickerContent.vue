<script setup lang="ts">
import type { ColorSwatch } from '../model/useColorPicker'

defineProps<{
  label: string
  swatches: ColorSwatch[]
  modelValue?: string
  compact?: boolean
}>()

const emit = defineEmits<{ select: [value: string] }>()
</script>

<template>
  <h3 class="font-semibold" :class="compact ? 'mb-1 text-xs' : 'mb-2 text-sm'">{{ label }}</h3>
  <div class="grid grid-cols-4" :class="compact ? 'gap-1' : 'gap-2'">
    <button
      v-for="swatch in swatches"
      :key="swatch.class"
      type="button"
      :title="swatch.name"
      class="btn btn-circle border border-base-content/20"
      :class="[
        compact ? 'btn-xs !size-5 !min-h-0 shrink-0 p-0' : 'btn-sm',
        swatch.class,
        { 'btn-active ring-2 ring-base-content ring-offset-2': swatch.class === modelValue },
      ]"
      @click="emit('select', swatch.class)"
    />
  </div>
</template>
