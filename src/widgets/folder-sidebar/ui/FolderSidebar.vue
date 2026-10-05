<script setup lang="ts">
import { UiCard, UiIconButton } from '@/shared/ui'
import { FolderTile, type Folder } from '@/entities/folder'

defineProps<{ folders: Folder[]; activeFolderId: number }>()
const emit = defineEmits<{ select: [folderId: number] }>()
</script>

<template>
  <UiCard as="aside" compact>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-black">Папки</h2>
      <UiIconButton label="Додати папку" variant="yellow" size="sm">+</UiIconButton>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <FolderTile
        v-for="folder in folders"
        :key="folder.id"
        :name="folder.name"
        :count="folder.count"
        :color="folder.color"
        :active="activeFolderId === folder.id"
        @click="emit('select', folder.id)"
      />
    </div>
    <div class="mt-8 rounded-brutal border-2 border-ink bg-primary-yellow p-4 shadow-brutal-sm">
      <p class="text-sm font-black">Швидка підказка</p>
      <p class="mt-1 text-sm leading-5">Створюйте папки для проєктів, навчання та особистих ідей.</p>
    </div>
  </UiCard>
</template>
