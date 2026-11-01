<script setup lang="ts">
import { watch } from 'vue'
import { TextEditor } from '@/features/rich-text-editor'
import { useNoteBlocks, type SyncStatus } from '@/entities/node'
import { UiButton } from '@/shared/ui'

defineOptions({ name: 'NoteBlocksEditor' })

const props = defineProps<{ noteId: string }>()
const status = defineModel<SyncStatus>('status', { default: 'saved' })

const {
  content,
  isLoading,
  loadError,
  status: syncStatus,
  schedule,
  reload,
} = useNoteBlocks(props.noteId)

watch(syncStatus, (value) => (status.value = value), { immediate: true })
</script>

<template>
  <p v-if="isLoading" class="p-4 text-sm text-ink-light">Завантаження…</p>

  <div v-else-if="loadError" class="flex items-center gap-3 p-4">
    <span class="text-sm">Не вдалося завантажити нотатку</span>
    <UiButton size="sm" @click="reload">Спробувати ще раз</UiButton>
  </div>

  <TextEditor v-else-if="content" :content="content" @update="schedule" />
</template>
