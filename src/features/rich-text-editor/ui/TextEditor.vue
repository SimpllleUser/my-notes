<script setup lang="ts">
import { BlokEditor } from '@bloklabs/vue'
import type { OutputData } from '@bloklabs/core'
import { computed } from 'vue'
import { useTheme } from '@/shared/lib/theme.ts'
import { ThemePalette } from '@/shared/model/enums.ts'
import { inlineTools, tools } from '@/features/rich-text-editor/model/tools.ts'

defineOptions({ name: 'TextEditor' })

defineProps<{ content: OutputData }>()
const emit = defineEmits<{ update: [data: OutputData] }>()

const { theme } = useTheme()
const editorTheme = computed(() =>
  [ThemePalette.Dark, ThemePalette.Dracula, ThemePalette.Night, ThemePalette.Dim].includes(theme.value)
    ? 'dark'
    : 'light',
)

const tokens = {
  '--blok-text-primary': 'var(--color-base-content)',
  '--blok-popover-bg': 'var(--color-base-100)',
  '--blok-bg-light': 'color-mix(in srgb, var(--color-base-content) 8%, transparent)',
  '--blok-bg-secondary': 'color-mix(in srgb, var(--color-base-content) 5%, transparent)',
  '--blok-bg-tertiary': 'color-mix(in srgb, var(--color-base-content) 8%, transparent)',
  '--blok-border-secondary': 'color-mix(in srgb, var(--color-base-content) 12%, transparent)',
  '--blok-selection': 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
  '--blok-placeholder-color': 'color-mix(in srgb, var(--color-base-content) 45%, transparent)',
}
</script>

<template>
  <div class="card min-h-[70dvh] bg-base-100 shadow-sm note-editor">
    <div class="card-body p-4 pb-20 md:p-6">
      <BlokEditor
        :tools="tools"
        :inline-tools="inlineTools"
        :data="content"
        :tokens="tokens"
        :theme="editorTheme"
        @save="emit('update', $event)"
      />
    </div>
  </div>
</template>

<style>
/* Токени гуттера Blok оголошує на самій обгортці, тому правило має бути на ній, а не на предку */
.note-editor [data-blok-interface] {
  --blok-editor-gutter-start: 56px;
}
</style>
