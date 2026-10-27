<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Content, JSONContent } from '@tiptap/vue-3'
import { UiCard, UiStatus } from '@/shared/ui'
import { TextEditor } from '@/features/rich-text-editor'
import { useNotesStore } from '@/entities/note/model/store.ts'
import type { Note } from '@/entities/note'
import { StatusTone } from '@/shared/model/enums.ts'

const props = defineProps<{
  note?: Note
  title?: string
}>()

const emit = defineEmits<{
  update: [value: Note]
}>()

interface TextEditorInstance {
  flush: () => Promise<void>
  isSaving: import('vue').Ref<boolean>
}

const editorRef = ref<TextEditorInstance | null>(null)
const notesStore = useNotesStore()

const localContent = ref<Content>(props.note?.content ?? '')

const isSaving = ref(false)
const lastError = ref<Error | null>(null)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

// Черга збережень, щоб записи до сервера не накладались один на один
let saveFinished = Promise.resolve()

const statusLabel = computed(() => {
  switch (saveStatus.value) {
    case 'saving':
      return 'Збереження…'
    case 'saved':
      return 'Збережено'
    case 'error':
      return 'Помилка збереження'
    default:
      return 'Збережено'
  }
})

const statusTone = computed(() =>
  saveStatus.value === 'error' ? StatusTone.Muted : StatusTone.Success
)

function requestSave() {
  // Демо-режим: якщо нотатку не передано — працюємо тільки як редактор,
  // збереження на сервер не виконується.
  if (!props.note) return

  isSaving.value = true
  lastError.value = null
  saveStatus.value = 'saving'

  saveFinished = saveFinished
    .then(() => saveNote())
    .catch((err) => {
      lastError.value = err instanceof Error ? err : new Error(String(err))
      saveStatus.value = 'error'
    })
    .finally(() => {
      isSaving.value = false
    })
}

async function saveNote() {
  const note = props.note!
  const payload: Note = {
    ...note,
    content: localContent.value as JSONContent,
  }

  // Нотатки без $id — нові, створюємо через create, інакше оновлюємо існуючу
  const response =
    note.$id
      ? await notesStore.update(payload)
      : await notesStore.create({
          name: note.name,
          folder: note.folder,
          content: localContent.value as JSONContent,
        })

  if (response.error) throw response.error
  if (response.data && !note.$id) {
    emit('update', response.data)
  }

  saveStatus.value = 'saved'
}

function onChanges() {
  if (!props.note) return
  // Редактор вже відправляє подію після свого дебаунсу (500 мс), тому тут
  // відправляємо поточну модель вмісту на сервер.
  requestSave()
}

/**
 * Надсилати всі накопичені зміни негайно. Викликати перед закриттям вкладки,
 * перемиканням вкладки у тлі або переходом між сторінками.
 */
async function flushPending() {
  await editorRef.value?.flush()
  await saveFinished
}

onBeforeUnmount(() => {
  void flushPending()
})

if (typeof window !== 'undefined') {
  const handlePageHide = () => void flushPending()
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') void flushPending()
  }
  window.addEventListener('pagehide', handlePageHide)
  window.addEventListener('visibilitychange', handleVisibilityChange)
  onBeforeUnmount(() => {
    window.removeEventListener('pagehide', handlePageHide)
    window.removeEventListener('visibilitychange', handleVisibilityChange)
  })
}

watch(
  () => props.note,
  (note) => {
    localContent.value = note?.content ?? ''
  },
  { deep: true },
)
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
    <TextEditor
      ref="editorRef"
      v-model:content="localContent"
      @changes="onChanges"
      class="m-3 flex-1 sm:m-6"
    />
  </UiCard>
</template>
