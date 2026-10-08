<script setup lang="ts">
import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { onMounted, reactive } from 'vue'
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
  // foldersStore.create(folderForm)
  console.log(folderForm)
  folderForm.name = ''
}
</script>

<template>
  <main>
    <div class="folder-list-wrapper p-8x overflow-y-auto">
      <FolderList>
        <template #header>
          <div class="mb-3">
            <div class="flex justify-center gap-3 pb-6">
              <UIInputField v-model="folderForm.name" placeholder="Create some folder" />
              <ColorPicker v-model="folderForm.color" label="Колір папки" auto-init>
                <template #trigger="{ toggle, value }">
                  <UiButton @click="toggle">
                    <span class="h-4 w-4 rounded border-2 border-ink" :class="value ?? 'bg-bg'" />
                  </UiButton>
                </template>
              </ColorPicker>
              <IconPicker v-model="folderForm.icon" auto-init>
                <template #trigger="{ toggle, icon: Icon }">
                  <UiButton @click="toggle"> <component :is="Icon" :size="16" /> </UiButton>
                </template>
              </IconPicker>
              <UiButton @click="create" @keyup.enter="create()"> Create </UiButton>
            </div>
            <hr />
          </div>
        </template>
      </FolderList>
    </div>
  </main>
</template>
