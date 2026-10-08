<script setup lang="ts">
import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { onMounted, reactive, ref } from 'vue'
import type { FolderPayload } from '@/entities/folder/model/types.ts'
import { UiButton, UIInputField } from '@/shared/ui'
import { ColorPicker } from '@/features/color-picker'
import { IconPicker } from '@/features/icon-picker'
import FolderList from '@/entities/folder/ui/FolderList.vue'

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
const showForm = ref<boolean>(false)
</script>

<template>
  <main>
    <h1 class="cursor-pointer" @click="showForm = !showForm">Home</h1>
    <div v-if="showForm">
      <div class="form flex justify-between">
        <UIInputField v-model="folderForm.name" />
        <hr />
        <ColorPicker v-model="folderForm.color" label="Колір папки" auto-init>
          <template #trigger="{ toggle, value }">
            <UiButton @click="toggle">
              <span class="h-4 w-4 rounded border-2 border-ink" :class="value ?? 'bg-bg'" />
              Колір
            </UiButton>
          </template>
        </ColorPicker>
        <hr />
        <IconPicker v-model="folderForm.icon" auto-init>
          <template #trigger="{ toggle, icon: Icon }">
            <UiButton @click="toggle"> <component :is="Icon" :size="16" /> Обрати іконку </UiButton>
          </template>
        </IconPicker>
      </div>
      <UiButton @click="create"> Create </UiButton>
    </div>
    <div class="folder-list-wrapper p-8x overflow-y-auto">
      <FolderList />
    </div>
  </main>
</template>
