<script setup lang="ts">
import { computed, ref } from 'vue'
import { UIExplorer } from '@/features/explorer'
import { NoteBlocksEditor } from '@/widgets/note-blocks-editor'
import { getSyncStatusView, SyncStatus } from '@/entities/node'
import { useLocalStorage } from '@vueuse/core'
import { useFoldersStore } from '@/entities/folder'
import { useNotesStore } from '@/entities/note'
import { UiButton, UiDivider } from '@/shared/ui'
import { ButtonVariant, ComponentSize, DaisyColor } from '@/shared/model/enums.ts'
import { Maximize, Minimize } from '@lucide/vue'
import HomePageHeader from '@/pages/home/ui/HomePageHeader.vue'

defineOptions({
  name: 'HomePage',
})

const foldersStore = useFoldersStore()
const notesStore = useNotesStore()

const folderId = useLocalStorage('folderId', '')
const noteId = useLocalStorage('noteId', '')
const syncStatus = ref<SyncStatus>(SyncStatus.Saved)
const statusView = computed(() => getSyncStatusView(syncStatus.value))
// Header reflects the active note only: selecting another folder must not change it.
const activeNoteEntry = computed(() => {
  if (!noteId.value) return null
  for (const [ownerFolderId, notes] of Object.entries(notesStore.noteByFolders)) {
    const note = notes.find(({ $id }) => $id === noteId.value)
    if (note) return { folderId: ownerFolderId, note }
  }
  return null
})
const folder = computed(() =>
  activeNoteEntry.value ? foldersStore.getFolder(activeNoteEntry.value.folderId) : undefined,
)
const noteTitle = computed(() => activeNoteEntry.value?.note.name ?? '')

const fullSizeEditor = useLocalStorage('fullSizeEditor', false)
</script>

<template>
  <div
    class="flex h-[calc(100dvh-3.75rem)] min-w-0 flex-col overflow-hidden md:flex-row"
  >
      <UIExplorer
        :status="statusView"
        v-model:folder="folderId"
        v-model:note="noteId"
      />
    <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <div class="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
        <HomePageHeader v-if="folder" :folder="folder" :note-title="noteTitle">
          <template #actions>
            <UiButton
              @click="fullSizeEditor = !fullSizeEditor"
              :size="ComponentSize.Small"
              :variant="ButtonVariant.Ghost"
              :color="DaisyColor.Neutral"
              class="ml-auto"
            >
              <Maximize :size="16" v-if="fullSizeEditor" />
              <Minimize :size="16" v-else />
            </UiButton>
          </template>
        </HomePageHeader>
        <UiDivider class="my-0 mr-1" />
        <NoteBlocksEditor
          v-if="noteId"
          :full-size="fullSizeEditor"
          :key="`${noteId}`"
          v-model:status="syncStatus"
          :note-id="noteId"
        >
        </NoteBlocksEditor>
      </div>
    </main>
  </div>
</template>
