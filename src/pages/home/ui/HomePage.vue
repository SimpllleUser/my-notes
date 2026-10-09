<script setup lang="ts">
import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { onMounted, reactive, ref } from 'vue'
import FolderList from '@/entities/folder/ui/FolderList.vue'
import { type Folder, FolderForm } from '@/entities/folder'
import type { FolderPayload } from '@/entities/folder/model/types.ts'
import type { Nullable } from '@/shared/model/types.ts'

defineOptions({
  name: 'HomePage',
})

const foldersStore = useFoldersStore()

onMounted(() => {
  foldersStore.getAll()
})

const onSubmit = async (payload: Folder | FolderPayload) => {
  const hasId = '$id' in payload
  const action = hasId ? foldersStore.update : foldersStore.create
  await action(payload)
  await foldersStore.getAll()
}

const folder = ref<Nullable<Folder>>(null)

const edit = (payload: Folder) => {
  folder.value = payload
}
const remove = async (payload: Folder) => {
  await foldersStore.delete(payload.$id)
  await foldersStore.getAll()
}
</script>

<template>
  <main>
    <div class="folder-list-wrapper p-8x overflow-y-auto">
      <FolderList @edit="edit" @delete="remove">
        <template #header>
          <div class="mb-3 pb-3">
            <FolderForm :folder="folder" @submit="onSubmit" />
            <hr />
          </div>
        </template>
      </FolderList>
    </div>
  </main>
</template>
