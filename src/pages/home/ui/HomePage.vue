<script setup lang="ts">
import { computed, ref } from 'vue'
import { UIExplorer } from '@/features/explorer'
import { NoteBlocksEditor } from '@/widgets/note-blocks-editor'
import { getSyncStatusView, SyncStatus } from '@/entities/node'
import { useLocalStorage } from '@vueuse/core'

defineOptions({
  name: 'HomePage',
})

const folderId = useLocalStorage('folderId', '')
const noteId = useLocalStorage('noteId', '')
const syncStatus = ref<SyncStatus>(SyncStatus.Saved)
const statusView = computed(() => getSyncStatusView(syncStatus.value))
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
    <main class="col-span-10 pl-2 border-l-4 border-l-base-300">
      <div class="folder-list-wrapper p-8x overflow-y-auto">
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
