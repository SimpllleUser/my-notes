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
const folder = computed(() => foldersStore.getFolder(folderId.value))
const noteTitle = computed(
  () =>
    notesStore.getNoteByFolder(folderId.value).find((note) => note.$id === noteId.value)?.name ||
    '',
)

const fullSizeEditor = useLocalStorage('fullSizeEditor', false)
</script>

<template>
  <div
    class="grid h-[calc(100dvh-3.75rem)] min-w-0 grid-rows-[auto_minmax(0,1fr)] grid-cols-1 overflow-hidden md:grid-rows-1 md:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)]"
  >
    <aside
      class="flex h-56 min-h-0 min-w-0 max-h-56 flex-col overflow-hidden bg-base-300 md:sticky md:top-0 md:h-full md:max-h-none"
    >
      <UIExplorer
        :status="statusView"
        class="w-full"
        v-model:folder="folderId"
        v-model:note="noteId"
      />
    </aside>
    <main class="min-h-0 min-w-0 overflow-hidden">
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
