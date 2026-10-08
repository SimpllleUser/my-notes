<script setup lang="ts">
import { computed, onBeforeMount } from 'vue'
import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { FolderTile } from '@/entities/folder'
import { UiCard } from '@/shared/ui'

defineOptions({
  name: 'FolderList',
})

const foldersStore = useFoldersStore()
const folders = computed(() => foldersStore.getFolders)

onBeforeMount(() => {
  foldersStore.getAll()
})
</script>

<template>
  <UiCard>
    <div
      class="grid grid-cols-2 gap-4 min-[480px]:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 min-h-[80vh]"
    >
      <FolderTile
        v-for="folder in folders"
        :key="folder.$id"
        :name="folder.name"
        :color="folder.color"
        :icon="folder.icon"
      />
    </div>
  </UiCard>
</template>

<style scoped></style>
