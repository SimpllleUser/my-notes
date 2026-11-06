<script setup lang="ts">
import { type Note, useNotesStore } from '@/entities/note'
import { onBeforeMount, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { NoteListPanel } from '@/widgets/note-list-panel'
import { UiButton, UiIconButton, UIInputField, UiPopover } from '@/shared/ui'
import { ButtonColor } from '@/shared/model/enums.ts'
import { Save } from '@lucide/vue'

const props = defineProps<{
  folder: { name: string; id: string }
}>()

const emit = defineEmits<{
  'set-note': [payload: Note]
}>()
const notesStore = useNotesStore()

const searchingName = ref('')
const popOverState = ref(false)

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
  const note = await notesStore.create({
    name: noteName.value,
    folder: props.folder.id,
  })
  hidePopOver()
  await notesStore.getAll(props.folder.id)
  if (note) selectNote(note)
}
</script>

<template>
  <NoteListPanel
    v-model:search="searchingName"
    @create="createNote()"
    @select="selectNote"
    :folder-name="folder.name"
    :notes="notesStore.getNotes(searchingName)"
    :active-note-id="activeNoteId"
  >
    <template #header-left><slot name="header-left" /></template>
    <template #header-right>
      <UiPopover v-model="popOverState" :open-on-hover="false" @click:outside="hidePopOver">
        <template #activator="{ props }">
          <UiIconButton v-bind="props" label="Створити нотатку" :color="ButtonColor.Primary"
            >+</UiIconButton
          >
        </template>
        <template #default>
          <div class="flex">
            <UIInputField v-model="noteName" placeholder="Name" class="max-w-50 w-100" />
            <UiButton @click="createNote" class="ml-2" :color="ButtonColor.Warning">
              <Save />
            </UiButton>
          </div>
        </template>
      </UiPopover>
    </template>
  </NoteListPanel>
</template>
