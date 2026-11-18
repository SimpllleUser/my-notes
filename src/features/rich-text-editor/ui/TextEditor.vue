<script setup lang="ts">
import { BlokEditor as RawBlokEditor } from '@bloklabs/vue'
import type { DefineComponent } from 'vue'
import type { Blok, BlokConfig, OutputData } from '@bloklabs/core'
import { computed, shallowRef, useTemplateRef } from 'vue'
import { useTheme } from '@/shared/lib/theme.ts'
import { ThemePalette } from '@/shared/model/enums.ts'
import { inlineToolbar, tools } from '../model/tools'
import EditorMobileToolbar from './EditorMobileToolbar.vue'

type EditorProps = Pick<BlokConfig, 'tools' | 'inlineToolbar' | 'style' | 'theme'> & {
  data: OutputData
  onSave?: (data: OutputData) => void
  onReady?: (blok: Blok) => void
}

// @bloklabs/vue's exported component resolves to `never` in vue-tsc. Keep a
// local prop contract so this integration remains checked at the call site.
const BlokEditor = RawBlokEditor as unknown as DefineComponent<EditorProps>

defineOptions({ name: 'TextEditor' })

const props = defineProps<{ content: OutputData; fullSize: boolean }>()
const emit = defineEmits<{ update: [data: OutputData] }>()

const blok = shallowRef<Blok | null>(null)
const editorEl = useTemplateRef<HTMLElement>('editorEl')

const { theme } = useTheme()
const editorTheme = computed(() =>
  [
    ThemePalette.Light,
    ThemePalette.Dark,
    ThemePalette.Pastel,
    ThemePalette.Fantasy,
    ThemePalette.Dracula,
    ThemePalette.Night,
    ThemePalette.Dim,
  ].includes(theme.value)
    ? 'dark'
    : 'light',
)

const style = computed(() => {
  const fullSizeToken = props.fullSize ? {
    '--blok-content-max-width': '100%',
  } : {}
  return {
    tokens: {
      ...fullSizeToken,
      '--blok-text-primary': 'var(--color-base-content)',
      '--blok-popover-bg': 'var(--color-base-100)',
      '--blok-bg-light': 'color-mix(in srgb, var(--color-base-content) 8%, transparent)',
      '--blok-bg-secondary': 'color-mix(in srgb, var(--color-base-content) 5%, transparent)',
      '--blok-bg-tertiary': 'color-mix(in srgb, var(--color-base-content) 8%, transparent)',
      '--blok-border-secondary': 'color-mix(in srgb, var(--color-base-content) 12%, transparent)',
      '--blok-selection': 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
      '--blok-placeholder-color': 'color-mix(in srgb, var(--color-base-content) 45%, transparent)',
    },
  }
})

function handleSave(data: OutputData) {
  emit('update', data)
}
</script>

<template>
  <div ref="editorEl" class="min-h-[70dvh] bg-base-100 shadow-sm note-editor">
    <div class="pb-10">
      <BlokEditor
        class="editor-fullscreen"
        :tools="tools"
        :inline-toolbar="inlineToolbar"
        :data="content"
        :style="style"
        :theme="editorTheme"
        @save="handleSave"
        @ready="blok = $event"
        width="100%"
      />
    </div>
  </div>
  <EditorMobileToolbar :blok="blok" :editor-el="editorEl" />
</template>

<style scoped>
.note-editor [data-blok-interface] {
  --blok-editor-gutter-start: 56px;
}
</style>
