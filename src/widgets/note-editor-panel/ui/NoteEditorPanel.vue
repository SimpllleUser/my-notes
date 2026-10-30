<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { JSONContent } from '@tiptap/vue-3'
import { UiCard, UiStatus } from '@/shared/ui'
import { TextEditor } from '@/features/rich-text-editor'
import { useNoteSync } from '@/entities/note/model/useNoteSync.ts'
import type { Note } from '@/entities/note'
import { useDebounceFn } from '@vueuse/core'

interface TextEditorInstance {
  flush: () => Promise<void>
  isSaving: import('vue').Ref<boolean>
}

const props = defineProps<{
  note?: Note
  title?: string
}>()

const emit = defineEmits<{
  update: [value: Note]
}>()

// Поточний вміст редактора (джерало істини для useNoteSync)
const EMPTY_CONTENT: JSONContent = { type: 'doc', content: [] }
const contentRef = ref<JSONContent>(props.note?.content ?? EMPTY_CONTENT)

// Бізнес-логіка синхронізації (черга, статус, помилки, підсилання при закритті вкладки)
const {
  lastError,
  statusLabel,
  statusTone,
  requestSave,
  flushPending,
  bindPageVisibilityHandlers,
} = useNoteSync(props.note, contentRef, emit)

const unbindPageVisibility = bindPageVisibilityHandlers()

onBeforeUnmount(() => {
  unbindPageVisibility?.()
  void flushPending()
})

// Синхронізувати локальний вміст при зміні нотатки ззовні
watch(
  () => props.note,
  (note: Note | undefined) => {
    contentRef.value = note?.content ?? EMPTY_CONTENT
  },
  { deep: true },
)

const onChanges = useDebounceFn(requestSave, 600)
</script>

<template>
  <UiCard
    as="section"
    class="flex min-h-[480px] sm:min-h-[620px] min-w-0 flex-col overflow-hidden !p-0"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b-3 border-ink px-4 py-3 sm:px-5 sm:py-4"
    >
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Редактор</p>
        <h2 class="break-words text-lg font-black sm:text-xl">{{ title }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <UiStatus :label="statusLabel" :tone="statusTone" />
        <span v-if="lastError" class="text-xs text-ink-dark">{{ lastError.message }}</span>
      </div>
    </div>
    <TextEditor v-model:content="contentRef" @update="onChanges" class="m-3 flex-1 sm:m-6" />
  </UiCard>
</template>
