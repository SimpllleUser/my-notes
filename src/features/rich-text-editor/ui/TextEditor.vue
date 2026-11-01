<script setup lang="ts">
import { BlokEditor } from '@bloklabs/vue'
import type { OutputData } from '@bloklabs/core'
import { useTheme } from '@/shared/lib/theme.ts'
import { inlineTools, tools } from '@/features/rich-text-editor/model/tools.ts'

defineOptions({ name: 'TextEditor' })

defineProps<{ content: OutputData }>()
const emit = defineEmits<{ update: [data: OutputData] }>()

const { theme } = useTheme()

const tokens = {
  '--blok-text-primary': 'var(--color-ink)',
  '--blok-popover-bg': 'var(--color-accent-paper)',
  '--blok-bg-light': 'color-mix(in srgb, var(--color-ink) 8%, transparent)',
  '--blok-bg-secondary': 'color-mix(in srgb, var(--color-ink) 5%, transparent)',
  '--blok-bg-tertiary': 'color-mix(in srgb, var(--color-ink) 8%, transparent)',
  '--blok-border-secondary': 'color-mix(in srgb, var(--color-ink) 12%, transparent)',
  '--blok-selection': 'color-mix(in srgb, var(--color-secondary-blue) 30%, transparent)',
  '--blok-placeholder-color': 'color-mix(in srgb, var(--color-ink) 45%, transparent)',
}
</script>

<template>
  <div class="note-editor">
    <BlokEditor
      :tools="tools"
      :inline-tools="inlineTools"
      :data="content"
      :tokens="tokens"
      :theme="theme"
      @save="emit('update', $event)"
    />
  </div>
</template>

<style>
.note-editor {
  min-height: 70dvh;
  border-radius: 12px;
  background: var(--color-accent-paper);
  padding: 1.5rem 1rem 5rem 0;
}

/* Токени гуттера Blok оголошує на самій обгортці, тому правило має бути на ній, а не на предку */
.note-editor [data-blok-interface] {
  --blok-editor-gutter-start: 56px;
}
</style>
