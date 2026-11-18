<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { SyncStatus } from '@/entities/node'
import { useWorkbenchStore } from '../model/useWorkbenchStore'
import EditorGroup from './EditorGroup.vue'
import WorkbenchResizer from './WorkbenchResizer.vue'

defineOptions({ name: 'EditorWorkbench' })

defineProps<{ fullSize: boolean }>()
/** Статус синхронізації кожної відкритої нотатки (noteId → status). */
const statuses = defineModel<Record<string, SyncStatus>>('statuses', { default: () => ({}) })

const store = useWorkbenchStore()
const container = useTemplateRef<HTMLElement>('container')

/** Піксельний зсув → відносні одиниці size (сума size відповідає повній ширині контейнера). */
function resizeAfter(groupId: string, deltaPx: number) {
  const width = container.value?.clientWidth
  if (!width) return
  const totalSize = store.groups.reduce((sum, group) => sum + group.size, 0)
  store.resizeGroups(groupId, (deltaPx / width) * totalSize)
}
</script>

<template>
  <div ref="container" class="flex h-full min-h-0 min-w-0 flex-col md:flex-row">
    <template v-for="(group, index) in store.groups" :key="group.id">
      <WorkbenchResizer
        v-if="index > 0"
        @resize="resizeAfter(store.groups[index - 1].id, $event)"
      />
      <EditorGroup v-model:statuses="statuses" :group="group" :full-size="fullSize">
        <template #header="slotProps">
          <slot name="header" v-bind="slotProps" />
        </template>
      </EditorGroup>
    </template>
  </div>
</template>
