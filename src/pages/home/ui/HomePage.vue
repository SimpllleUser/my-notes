<script setup lang="ts">
import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { onMounted, reactive } from 'vue'
import type { FolderPayload } from '@/entities/folder/model/types.ts'
import { UiButton, UIInputField } from '@/shared/ui'
import { ColorPicker } from '@/features/color-picker'
import { IconPicker } from '@/features/icon-picker'

defineOptions({
  name: 'HomePage',
})

const foldersStore = useFoldersStore()

const folderForm = reactive<FolderPayload>({
  name: '',
  icon: '',
  color: '',
})

onMounted(() => {
  foldersStore.getAll()
})

const create = () => {
  foldersStore.create(folderForm)
  folderForm.name = ''
  folderForm.color = ''
  folderForm.icon = ''
}
</script>

<template>
  <main>
    <h1>Home</h1>
    <div class="form flex justify-between">
      <UIInputField v-model="folderForm.name" />
      <hr />
      <ColorPicker v-model="folderForm.color" auto-init />
      <hr />
      <IconPicker v-model="folderForm.icon" auto-init />
    </div>
    <UiButton @click="create"> Create </UiButton>
  </main>
</template>
