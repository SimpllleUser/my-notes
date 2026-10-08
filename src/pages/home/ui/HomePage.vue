<script setup lang="ts">
import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { onMounted } from 'vue'
import FolderList from '@/entities/folder/ui/FolderList.vue'
import { type Folder, FolderForm } from '@/entities/folder'
import type { FolderPayload } from '@/entities/folder/model/types.ts'

defineOptions({
  name: 'HomePage',
})

const foldersStore = useFoldersStore()

onMounted(() => {
  foldersStore.getAll()
})


const onSubmit = async (payload: Folder | FolderPayload) => {
  const hasId = 'id' in payload
  const action = hasId ? foldersStore.update : foldersStore.create
  await action(payload)
  await foldersStore.getAll()
}
</script>

<template>
  <main>
    <div class="folder-list-wrapper p-8x overflow-y-auto">
      <FolderList>
        <template #header>
          <div class="mb-3 pb-3">
            <FolderForm @submit="onSubmit" />
            <hr />
          </div>
        </template>
      </FolderList>
    </div>
  </main>
</template>
