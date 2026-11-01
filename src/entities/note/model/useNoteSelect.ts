import { computed, type ComputedRef, onBeforeMount, ref, watch } from 'vue'
import type { Nullable } from '@/shared/model/types.ts'
import type { Note } from '@/entities/note'
import { useNotesStore } from './store'

export function useNoteSelect(folderId: ComputedRef<Nullable<string>>) {
  const noteStore = useNotesStore()

  const activeNote = ref<Nullable<Note>>(null)
  const notes = computed(() => noteStore.noteList)

  const setNote = (note: Note): void => {
    activeNote.value = note
  }

  watch(
    () => folderId.value,
    async (id) => {
      if (!id) return
      await noteStore.getAll(id)
    },
  )

  return {
    setNote,
    notes,
    activeNote,
  }
}
