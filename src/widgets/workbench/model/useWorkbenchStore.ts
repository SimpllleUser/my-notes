import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import * as layout from './layout'
import type { WorkbenchState } from './types'

const STORAGE_KEY = 'workbench'

export const useWorkbenchStore = defineStore('workbench', () => {
  const state = useLocalStorage<WorkbenchState>(STORAGE_KEY, layout.createInitialState(), {
    serializer: { read: layout.parseState, write: JSON.stringify },
  })

  const groups = computed(() => state.value.groups)
  const activeGroupId = computed(() => state.value.activeGroupId)
  const activeNoteId = computed(
    () => groups.value.find((group) => group.id === activeGroupId.value)?.activeTab ?? '',
  )

  /** Застосовує чисту функцію layout до поточного стану. */
  const apply = (transform: (current: WorkbenchState) => WorkbenchState) => {
    state.value = transform(state.value)
  }

  return {
    groups,
    activeGroupId,
    activeNoteId,
    openNote: (noteId: string) => apply((s) => layout.openTab(s, noteId)),
    activateTab: (groupId: string, noteId: string) =>
      apply((s) => layout.activateTab(s, groupId, noteId)),
    closeTab: (groupId: string, noteId: string) => apply((s) => layout.closeTab(s, groupId, noteId)),
    focusGroup: (groupId: string) => apply((s) => layout.focusGroup(s, groupId)),
    splitRight: (groupId: string, noteId: string) =>
      apply((s) => layout.splitRight(s, groupId, noteId)),
    moveTab: (noteId: string, toGroupId: string) =>
      apply((s) => layout.moveTab(s, noteId, toGroupId)),
    resizeGroups: (leftGroupId: string, delta: number) =>
      apply((s) => layout.resizeGroups(s, leftGroupId, delta)),
    retainTabs: (existing: ReadonlySet<string>) => apply((s) => layout.retainTabs(s, existing)),
  }
})
