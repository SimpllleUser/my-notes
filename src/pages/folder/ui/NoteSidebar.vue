<script setup lang="ts">
import type { JSONContent } from '@tiptap/vue-3'
import type { Note } from '@/entities/note'
import { useNotesStore } from '@/entities/note/model/store.ts'
import { onBeforeMount, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { NoteListPanel } from '@/widgets/note-list-panel'
import { UiButton, UiIconButton, UIInputField, UiPopover } from '@/shared/ui'
import { ButtonVariant } from '@/shared/model/enums.ts'
import { Save } from '@lucide/vue'

const props = defineProps<{
  folder: { name: string; id: string }
}>()

const emit = defineEmits<{
  'set-note': [payload: Note]
}>()
const notesStore = useNotesStore()

// Порожній початковий документ Tiptap для нової нотатки
const EMPTY_CONTENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
}

const searchingName = ref('')
const activeNote = useLocalStorage<Note>(`node-${props.folder.id}}`, {} as Note)
const popOverState = ref(false)

onBeforeMount(async () => {
  await notesStore.getAll(props.folder.id)
  if (!activeNote.value?.$id) activeNote.value = notesStore.getNotes()[0]
  emit('set-note', activeNote.value as Note)
})

const create = () => {
  popOverState.value = false
}

const noteName = ref('')
const hidePopOver = () => {
  noteName.value = ''
  popOverState.value = false
}

const activeNoteId = useLocalStorage<string>(`active-note:${props.folder.id}`, '')

onBeforeMount(async () => {
  await notesStore.getAll(props.folder.id)
  const notes = notesStore.getNotes()
  const note = notes.find((item) => item.$id === activeNoteId.value) ?? notes[0]
  if (note) selectNote(note)
})

const selectNote = (note: Note) => {
  activeNoteId.value = note.$id
  emit('set-note', note)
}

const createNote = async () => {
  const { data } = await notesStore.create({
    name: noteName.value,
    folder: props.folder.id,
    content: EMPTY_CONTENT,
  })
  hidePopOver()
  await notesStore.getAll(props.folder.id)
  if (data) selectNote(data)
}
</script>

<template>
  <NoteListPanel
    v-model:search="searchingName"
    @create="create"
    @select="selectNote"
    :folder-name="folder.name"
    :notes="notesStore.getNotes(searchingName)"
    :active-note-id="activeNoteId"
  >
    <template #header-left><slot name="header-left" /></template>
    <template #header-right>
      <UiPopover v-model="popOverState" :openOnHover="false" @click:outside="hidePopOver">
        <template #activator="{ props }">
          <UiIconButton
            v-bind="props"
            label="Створити нотатку"
            :variant="ButtonVariant.Primary"
            @click="popOverState = !popOverState"
            >+</UiIconButton
          >
        </template>
        <template #default>
          <div class="flex">
            <UIInputField v-model="noteName" placeholder="Name" class="max-w-50 w-100" />
            <UiButton @click="createNote" class="ml-2" :variant="ButtonVariant.Yellow">
              <Save />
            </UiButton>
          </div>
        </template>
      </UiPopover>
    </template>
  </NoteListPanel>
</template>
