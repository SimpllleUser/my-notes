<script setup lang="ts">
defineOptions({
  name: 'FolderSelectPicker',
})

import { useFolderSelect } from '@/entities/folder'
import { ref } from 'vue'
import { usePickerOpen } from '@/shared/lib/usePickerOpen.ts'
import { UiButton, UiPicker } from '@/shared/ui'
import { ButtonVariant } from '@/shared/model/enums.ts'

const { activeFolder, folders, setFolder, goToFolder } = useFolderSelect()
const popover = ref(true)
const { open, hide } = usePickerOpen(() => popover.value)

async function selectFolder(folder: (typeof folders.value)[number]) {
  setFolder(folder)
  await goToFolder()
  hide()
}
</script>

<template>
  <UiPicker v-model:open="open" :popover="popover">
    <template #trigger="{ toggle }">
      <UiButton :variant="ButtonVariant.Outlined" @click="toggle">
        {{ activeFolder ? activeFolder.name : 'Project' }}
      </UiButton>
    </template>
    <template #default>
      <ul class="menu w-52 p-0">
        <li v-for="folder in folders" :key="folder.$id">
          <button @click="selectFolder(folder)">{{ folder.name }}</button>
        </li>
      </ul>
    </template>
  </UiPicker>
</template>

<style scoped></style>
