<script setup lang="ts">
defineOptions({
  name: 'FolderSelectSlider',
})

import { useFolderSelect } from '@/entities/folder'
import { ref, watch } from 'vue'
import { UiButton } from '@/shared/ui'

const { activeFolder, folders, setFolder, goToFolder } = useFolderSelect()

const element = ref<HTMLElement | null>(null)
watch(
  () => activeFolder.value,
  (folder) => {
    element.value = document.querySelector(`#${folder?.name}-${folder?.$id}`)
    element.value?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
  },
)
</script>

<template>
  <div class="flex items-center overflow-auto p-2">
    <UiButton
      @click="
        () => {
          setFolder(folder)
          goToFolder()
        }
      "
      v-for="(folder, index) in folders"
      :key="folder.$id"
      :class="{ 'ml-4': index }"
      :id="`${folder?.name}-${folder?.$id}`"
      :active="folder.$id === activeFolder?.$id"
    >
      {{ folder.name }}
    </UiButton>
  </div>
</template>

<style scoped></style>
