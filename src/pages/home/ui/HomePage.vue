<script setup lang="ts">
import { computed, ref } from 'vue'
import { UIExplorer } from '@/features/explorer'
import { NoteBlocksEditor } from '@/widgets/note-blocks-editor'
import { getSyncStatusView, SyncStatus } from '@/entities/node'
import { useLocalStorage } from '@vueuse/core'
import { useFoldersStore } from '@/entities/folder'
import { useNotesStore } from '@/entities/note'
import { UiDivider, UiDynamicIcon } from '@/shared/ui'

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
</script>

<template>
  <div class="grid min-h-[calc(100vh-3.75rem)] min-w-0 grid-cols-1 md:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)]">
    <aside class="min-w-0 max-h-56 overflow-y-auto bg-base-300 md:sticky md:top-0 md:h-[calc(100vh-3.75rem)] md:max-h-none">
      <UIExplorer
        :status="statusView"
        class="w-full"
        v-model:folder="folderId"
        v-model:note="noteId"
      />
    </aside>
    <main class="min-w-0">
      <div class="min-w-0 overflow-x-hidden overflow-y-auto">
        <div class="flex min-w-0 flex-wrap items-end gap-y-1 p-2 pb-0 sm:p-4 sm:pb-0">
          <div class="shrink-0 pr-2">
            <div :class="folder?.color" class="p-1 rounded-sm">
              <UiDynamicIcon
                v-if="folder?.icon"
                :name="folder.icon"
                class="text-ink"
                :size="30"
              />
            </div>
          </div>
          <div class="min-w-0 max-w-full break-words text-2xl sm:text-3xl lg:text-4xl">
            {{ folder?.name || '' }}
          </div>
          <div class="px-2 text-xl opacity-40 sm:px-4 sm:text-2xl">\</div>
          <div class="min-w-0 max-w-full break-words text-lg opacity-60 sm:text-xl lg:text-2xl">{{ noteTitle }}</div>
        </div>
        <UiDivider class="my-0 mr-1" />
        <NoteBlocksEditor
          v-if="noteId"
          :key="`${noteId}`"
          v-model:status="syncStatus"
          :note-id="noteId"
        >
        </NoteBlocksEditor>
      </div>
    </main>
  </div>
</template>
