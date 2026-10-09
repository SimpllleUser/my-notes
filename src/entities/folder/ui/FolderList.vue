<script setup lang="ts">
import { computed, onBeforeMount } from 'vue'
import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { type Folder, FolderTile } from '@/entities/folder'
import { UiCard } from '@/shared/ui'

defineOptions({
  name: 'FolderList',
})

const foldersStore = useFoldersStore()
const folders = computed(() => foldersStore.getFolders)

defineEmits<{
  click: [payload: string];
  edit: [payload: Folder];
  delete: [payload: Folder];
}>()

onBeforeMount(() => {
  foldersStore.getAll()
})
</script>

<template>
  <UiCard>
    <div class="min-h-[80vh]">
      <slot name="header"></slot>
      <div class="grid grid-cols-2 gap-4 min-[480px]:grid-cols-4 md:grid-cols-4 lg:grid-cols-8">
        <FolderTile
          v-for="folder in folders"
          :key="folder.$id"
          :folder="folder"
          @click="$emit('click', folder.$id)"
          @delete="$emit('delete', folder)"
          @edit="$emit('edit', folder)"
          actions
        />
      </div>
    </div>
  </UiCard>
</template>

<style scoped></style>
