<script setup lang="ts">
import { UiCard, UiIconButton } from '@/shared/ui'
import { FolderTile, type Folder } from '@/entities/folder'
import { IconPicker } from '@/features/icon-picker'

defineProps<{ folders: Folder[]; activeFolderId: number }>()
const emit = defineEmits<{ select: [folderId: number]; create: [folder: { name: string; icon: string }] }>()

function handleIconPicked(icon: string) {
  const name = window.prompt('Назва папки', 'Нова папка')
  if (!name) return
  emit('create', { name, icon })
}
</script>

<template>
  <UiCard as="aside" compact>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-black">Папки</h2>
      <IconPicker label="Додати папку" @select="handleIconPicked">
        <template #trigger="{ toggle }">
          <UiIconButton label="Додати папку" variant="yellow" size="sm" @click="toggle">+</UiIconButton>
        </template>
      </IconPicker>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <FolderTile
        v-for="folder in folders"
        :key="folder.id"
        :name="folder.name"
        :count="folder.count"
        :color="folder.color"
        :icon="folder.icon"
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
