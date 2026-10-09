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

defineOptions({
  name: 'FolderPage',
})

const route = useRoute()

const folderId = computed(() => (route.params?.id as string) || '')
const notesStore = useNotesStore()

const searchingName = ref('')
const activeId = useLocalStorage(`node-${folderId.value}}`, '')
const popOverState = ref(false)

onBeforeMount(async () => {
  await notesStore.getAll(folderId.value)
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
    folder: folderId.value,
  })

  hidePopOver()
  await notesStore.getAll(folderId.value)
}
</script>

<template>
  <main>
    <NoteListPanel
      v-model:search="searchingName"
      @create="create"
      @select="selectNote"
      :folder-name="folderId"
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
