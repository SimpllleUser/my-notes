<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppendImportButton, UIExplorer } from '@/features/explorer'
import { EditorWorkbench, useWorkbenchStore } from '@/widgets/workbench'
import { getSyncStatusView, SyncStatus } from '@/entities/node'
import { useLocalStorage } from '@vueuse/core'
import { useFoldersStore } from '@/entities/folder'
import { useNoteLookup } from '@/entities/note'
import { UiButton } from '@/shared/ui'
import { ButtonVariant, ComponentSize, DaisyColor } from '@/shared/model/enums.ts'
import { BookOpen, Maximize, Minimize, Pencil } from '@lucide/vue'
import HomePageHeader from '@/pages/home/ui/HomePageHeader.vue'

defineOptions({
  name: 'HomePage',
})

const foldersStore = useFoldersStore()
const workbench = useWorkbenchStore()
const { findNote, noteIds, isLoaded } = useNoteLookup()

const folderId = useLocalStorage('folderId', '')
const fullSizeEditor = useLocalStorage('fullSizeEditor', false)
const readMode = useLocalStorage('readMode', false)
const statuses = ref<Record<string, SyncStatus>>({})

// Активна нотатка належить workbench; провідник лише відкриває нотатки у вкладках.
const noteId = computed({
  get: () => workbench.activeNoteId,
  set: (id: string) => {
    if (id) workbench.openNote(id)
  },
})
const statusView = computed(() =>
  getSyncStatusView(statuses.value[noteId.value] ?? SyncStatus.Saved),
)

function getHeaderData(id: string) {
  const location = findNote(id)
  return {
    folder: location ? foldersStore.getFolder(location.folderId) : null,
    noteTitle: location?.note.name ?? '',
  }
}

// Закриваємо вкладки видалених нотаток.
watch(noteIds, (ids) => isLoaded.value && workbench.retainTabs(ids), { immediate: true })

// Перемикання вкладки розкриває її папку в провіднику.
watch(
  () => findNote(noteId.value)?.folderId,
  (activeFolderId) => {
    if (activeFolderId) folderId.value = activeFolderId
  },
)
</script>

<template>
  <div class="flex h-[calc(100dvh-3.75rem)] min-w-0 flex-col overflow-hidden md:flex-row">
    <UIExplorer :status="statusView" v-model:folder="folderId" v-model:note="noteId" />
    <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <EditorWorkbench
        v-model:statuses="statuses"
        :full-size="fullSizeEditor"
        :read-only="readMode"
      >
        <template #header="{ noteId: headerNoteId }">
          <HomePageHeader
            v-if="getHeaderData(headerNoteId).folder"
            :folder="getHeaderData(headerNoteId).folder!"
            :note-title="getHeaderData(headerNoteId).noteTitle"
          >
            <template #actions>
              <div>
                <AppendImportButton :note-id="headerNoteId" class="ml-auto" />
                <UiButton
                  @click="readMode = !readMode"
                  :size="ComponentSize.Small"
                  :variant="ButtonVariant.Ghost"
                  :color="DaisyColor.Neutral"
                  :title="readMode ? 'Режим редагування' : 'Режим читання'"
                  :aria-label="readMode ? 'Режим редагування' : 'Режим читання'"
                  :aria-pressed="readMode"
                >
                  <Pencil :size="16" v-if="readMode" />
                  <BookOpen :size="16" v-else />
                </UiButton>
                <UiButton
                  @click="fullSizeEditor = !fullSizeEditor"
                  :size="ComponentSize.Small"
                  :variant="ButtonVariant.Ghost"
                  :color="DaisyColor.Neutral"
                >
                  <Maximize :size="16" v-if="fullSizeEditor" />
                  <Minimize :size="16" v-else />
                </UiButton>
              </div>
            </template>
          </HomePageHeader>
        </template>
      </EditorWorkbench>
    </main>
  </div>
</template>
