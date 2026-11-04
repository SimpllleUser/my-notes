<script setup lang="ts">
import { computed, ref } from 'vue'
import { UIExplorer } from '@/features/explorer'
import { NoteBlocksEditor } from '@/widgets/note-blocks-editor'
import { UiDivider, UiStatus, type FileTreeNode } from '@/shared/ui'
import { getSyncStatusView, type SyncStatus } from '@/entities/node'
import { DividerDirection } from '@/shared/model/enums.ts'

defineOptions({
  name: 'HomePage',
})
// const onSubmit = async (payload: Folder | FolderPayload) => {
//   const hasId = '$id' in payload
//   const action = hasId ? foldersStore.update : foldersStore.create
//   await action(payload)
//   await foldersStore.getAll()
// }
//
// const folder = ref<Nullable<Folder>>(null)
//
//
// const edit = (payload: Folder) => {
//   folder.value = payload
// }
// const remove = async (payload: Folder) => {
//   await foldersStore.delete(payload.$id)
//   await foldersStore.getAll()
// }

const folderId = ref('')
const noteId = ref('')
const preSelected = ref<FileTreeNode | null>(null)
const syncStatus = ref<SyncStatus>('saved')
const statusView = computed(() => getSyncStatusView(syncStatus.value))
</script>

<template>
  <div class="grid grid-cols-12">
    <aside class="col-span-2 h-screen bg-base-300">
      {{ preSelected }}
      <UIExplorer
        class="w-full"
        v-model:folder="folderId"
        v-model:note="noteId"
        v-model:pre-selected="preSelected"
      />
    </aside>
    <main class="col-span-10 pl-2 border-l-4 border-l-base-300">
      <div class="folder-list-wrapper p-8x overflow-y-auto">
        <UiStatus :label="statusView.label" :tone="statusView.tone" />

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
