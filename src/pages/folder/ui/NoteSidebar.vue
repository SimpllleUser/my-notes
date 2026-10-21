<script setup lang="ts">
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
const notesStore = useNotesStore()

const searchingName = ref('')
const activeId = useLocalStorage(`node-${props.folder.id}}`, '')
const popOverState = ref(false)

onBeforeMount(async () => {
  await notesStore.getAll(props.folder.id)
  if (!activeId.value) activeId.value = notesStore.getNotes()[0]?.$id || ''
})

const selectNote = (note: Note) => {
  activeId.value = note.$id
}

const create = () => {
  popOverState.value = false
}

const noteName = ref('')
const hidePopOver = () => {
  noteName.value = ''
  popOverState.value = false
}

const createNote = async () => {
  await notesStore.create({
    name: noteName.value,
    folder: props.folder.id,
  })

  hidePopOver()
  await notesStore.getAll(props.folder.id)
}
</script>

<template>
  <NoteListPanel
    v-model:search="searchingName"
    @create="create"
    @select="selectNote"
    :folder-name="folder.name"
    :notes="notesStore.getNotes(searchingName)"
    :active-note-id="activeId"
  >
    <template #header-left><slot name="header-left"/></template>
    <template #header-right>
      <UiPopover
        v-model="popOverState"
        :openOnHover="false"
        @click:outside="hidePopOver"
      >
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
