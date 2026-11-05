import { type ComputedRef, watch } from 'vue'
import { useNotesStore } from './store'

export function useNoteSelect(folderIds: ComputedRef<string[]>) {
  const noteStore = useNotesStore()

  watch(
    folderIds,
    async (ids) => {
      await noteStore.getByFolder(ids)
    },
    { immediate: true },
  )

  return { getNoteByFolder: noteStore.getNoteByFolder }
}
