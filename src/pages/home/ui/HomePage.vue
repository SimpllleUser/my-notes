<script setup lang="ts">
import { computed, ref } from 'vue'
import { UIExplorer } from '@/features/explorer'
import { NoteBlocksEditor } from '@/widgets/note-blocks-editor'
import { getSyncStatusView, SyncStatus } from '@/entities/node'
import { useLocalStorage } from '@vueuse/core'
import { useFoldersStore } from '@/entities/folder'
import { useNotesStore } from '@/entities/note'
import { UiDivider, UiDynamicIcon } from '@/shared/ui'
import { MoveRight } from '@lucide/vue'

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
  <div class="grid grid-cols-12">
    <aside class="col-span-2 h-screen bg-base-300">
      <UIExplorer
        :status="statusView"
        class="w-full"
        v-model:folder="folderId"
        v-model:note="noteId"
      />
    </aside>
    <main class="col-span-10 ml-2">
      <div class="folder-list-wrapper p-8x overflow-y-auto">
        <div class="flex items-end p-4 pb-0">
          <div class="pr-2">
            <UiDynamicIcon v-if="folder?.icon" :name="folder.icon" :size="40" />
          </div>
          <div class="text-4xl opacity-80">
            {{ folder?.name || '' }}
          </div>
          <div class="px-4 text-2xl opacity-40">
            \
          </div>
          <div class="text-2xl opacity-60">{{ noteTitle }}</div>
        </div>
        <UiDivider class="mr-1"/>
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
