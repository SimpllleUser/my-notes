<script setup lang="ts">
defineOptions({
  name: 'FolderSelectPicker',
})

import { useFolderSelect } from '@/entities/folder'
import { ref } from 'vue'
import { usePickerOpen } from '@/shared/lib/usePickerOpen.ts'
import { UiButton, UiPicker } from '@/shared/ui'

const { activeFolder, folders, setFolder, goToFolder } = useFolderSelect()
const popover = ref(true)
const { open, hide } = usePickerOpen(() => popover.value)
</script>

<template>
  <UiPicker v-model:open="open" :popover="popover">
    <template #trigger="{ toggle }">
      <span @click="toggle">
        {{ activeFolder ? activeFolder.name : 'Project' }}
      </span>
    </template>
    <div
      v-for="(folder, index) in folders"
      :key="folder.$id"
      class="flex items-center gap-2 justify-center"
      :class="{ 'mt-2': index }"
    >
      <UiButton
        class="w-full"
        @click="
          () => {
            setFolder(folder)
            goToFolder()
            hide()
          }
        "
      >
        {{ folder.name }}
      </UiButton>
    </div>
  </UiPicker>
</template>

<style scoped></style>
