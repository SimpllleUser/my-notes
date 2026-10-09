<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useNotesStore } from '@/entities/note/model/store.ts'
import { useRoute } from 'vue-router'
import { NoteListPanel } from '@/widgets/note-list-panel'
import type { Note } from '@/entities/note'
import { useLocalStorage } from '@vueuse/core'
import { UiButton, UiIconButton, UIInputField, UiPopover } from '@/shared/ui'
import { ButtonVariant } from '@/shared/model/enums.ts'
import { Save } from '@lucide/vue'
import type { Folder } from '@/entities/folder'

defineOptions({
  name: 'FolderPage',
})

const route = useRoute()

const currentFolder = computed(
  () => (route.params as { name: string; id: string }) || { name: '', id: '' },
)
const notesStore = useNotesStore()

const searchingName = ref('')
const activeId = useLocalStorage(`node-${currentFolder.value.id}}`, '')
const popOverState = ref(false)

onBeforeMount(async () => {
  await notesStore.getAll(currentFolder.value.id)
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
    folder: currentFolder.value.id,
  })

  hidePopOver()
  await notesStore.getAll(currentFolder.value.id)
}
</script>

<template>
  <main>
    <NoteListPanel
      v-model:search="searchingName"
      @create="create"
      @select="selectNote"
      :folder-name="currentFolder.name"
      :notes="notesStore.getNotes(searchingName)"
      :active-note-id="activeId"
    >
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
              <UIInputField v-model="noteName" placeholder="Name" class="w-100" />
              <UiButton @click="createNote" class="ml-2" :variant="ButtonVariant.Yellow">
                <Save />
              </UiButton>
            </div>
          </template>
        </UiPopover>
      </template>
    </NoteListPanel>
  </main>
</template>
