<script setup lang="ts">
import { computed } from 'vue'
import { NoteBlocksEditor } from '@/widgets/note-blocks-editor'
import { useNoteLookup } from '@/entities/note'
import { getNoteRevision, SyncStatus } from '@/entities/node'
import { UiDivider } from '@/shared/ui'
import { useWorkbenchStore } from '../model/useWorkbenchStore'
import type { EditorGroup } from '../model/types'
import WorkbenchTabs from './WorkbenchTabs.vue'

defineOptions({ name: 'EditorGroup' })

const props = defineProps<{ group: EditorGroup; fullSize: boolean; readOnly: boolean }>()
const statuses = defineModel<Record<string, SyncStatus>>('statuses', { default: () => ({}) })

const store = useWorkbenchStore()
const { findNote } = useNoteLookup()

const tabs = computed(() =>
  props.group.tabs.map((id) => ({ id, title: findNote(id)?.note.name ?? '' })),
)
const isFocused = computed(() => store.activeGroupId === props.group.id)
const canSplit = computed(() => props.group.tabs.length > 1)

function setStatus(noteId: string, status: SyncStatus) {
  statuses.value = { ...statuses.value, [noteId]: status }
}
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-1 flex-col border-base-300 not-first:border-t md:grow-(--group-size) md:not-first:border-t-0"
    :style="{ '--group-size': group.size }"
    @pointerdown.capture="store.focusGroup(group.id)"
  >
    <WorkbenchTabs
      :tabs="tabs"
      :active-id="group.activeTab"
      :focused="isFocused"
      :can-split="canSplit"
      @select="store.activateTab(group.id, $event)"
      @close="store.closeTab(group.id, $event)"
      @split="group.activeTab && store.splitRight(group.id, group.activeTab)"
      @drop-tab="store.moveTab($event, group.id)"
    />
    <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      <template v-if="group.activeTab">
        <slot name="header" :note-id="group.activeTab" />
        <UiDivider class="my-0 mr-1" />
        <NoteBlocksEditor
          :key="`${group.activeTab}:${getNoteRevision(group.activeTab)}`"
          :note-id="group.activeTab"
          :full-size="fullSize"
          :read-only="readOnly"
          @update:status="setStatus(group.activeTab, $event)"
        />
      </template>
      <p v-else class="p-6 text-sm opacity-50">Оберіть нотатку в провіднику</p>
    </div>
  </section>
</template>
