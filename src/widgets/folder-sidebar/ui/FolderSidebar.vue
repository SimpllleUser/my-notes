<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiIconButton } from '@/shared/ui'
import { FolderTile, type Folder } from '@/entities/folder'
import { IconPicker } from '@/features/icon-picker'
import { ColorPicker } from '@/features/color-picker'

defineProps<{ folders: Folder[]; activeFolderId: number }>()
const emit = defineEmits<{ select: [folderId: number]; create: [folder: { name: string; icon: string; color: string }] }>()

const pendingIcon = ref<string | null>(null)

function handleIconPicked(icon: string) {
  pendingIcon.value = icon
}

function handleColorPicked(color: string) {
  const icon = pendingIcon.value
  pendingIcon.value = null
  if (!icon) return
  const name = window.prompt('Назва папки', 'Нова папка')
  if (!name) return
  emit('create', { name, icon, color })
}
</script>

<template>
  <UiCard as="aside" compact>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-black">Папки</h2>
      <div class="flex items-center gap-2">
        <ColorPicker v-if="pendingIcon" label="Колір папки" auto-open @select="handleColorPicked" />
        <IconPicker label="Додати папку" @select="handleIconPicked">
          <template #trigger="{ toggle }">
            <UiIconButton label="Додати папку" variant="yellow" size="sm" @click="toggle">+</UiIconButton>
          </template>
        </IconPicker>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-2">
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
    <div class="mt-5 lg:mt-8 rounded-brutal border-2 border-ink bg-primary-yellow p-4 shadow-brutal-sm">
      <p class="text-sm font-black">Швидка підказка</p>
      <p class="mt-1 text-sm leading-5">Створюйте папки для проєктів, навчання та особистих ідей.</p>
    </div>
  </UiCard>
</template>
