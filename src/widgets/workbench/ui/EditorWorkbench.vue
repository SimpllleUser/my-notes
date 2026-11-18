<script setup lang="ts">
import { SyncStatus } from '@/entities/node'
import { useWorkbenchStore } from '../model/useWorkbenchStore'
import EditorGroup from './EditorGroup.vue'

defineOptions({ name: 'EditorWorkbench' })

defineProps<{ fullSize: boolean }>()
/** Статус синхронізації кожної відкритої нотатки (noteId → status). */
const statuses = defineModel<Record<string, SyncStatus>>('statuses', { default: () => ({}) })

const store = useWorkbenchStore()
</script>

<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col md:flex-row">
    <EditorGroup
      v-for="group in store.groups"
      :key="group.id"
      v-model:statuses="statuses"
      :group="group"
      :full-size="fullSize"
    >
      <template #header="slotProps">
        <slot name="header" v-bind="slotProps" />
      </template>
    </EditorGroup>
  </div>
</template>
