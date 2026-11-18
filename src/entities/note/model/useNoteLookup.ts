import { computed } from 'vue'
import { useNotesStore } from './store'
import type { Note } from './types'

export interface NoteLocation {
  note: Note
  folderId: string
}

/** Пошук нотатки за id серед усіх завантажених папок. */
export function useNoteLookup() {
  const store = useNotesStore()

  const index = computed(() => {
    const entries = Object.entries(store.noteByFolders).flatMap(([folderId, notes]) =>
      notes.map((note) => [note.$id, { note, folderId }] as const),
    )
    return new Map<string, NoteLocation>(entries)
  })

  const isLoaded = computed(() => Object.keys(store.noteByFolders).length > 0)
  const noteIds = computed(() => new Set(index.value.keys()))
  const findNote = (noteId: string) => index.value.get(noteId)

  return { findNote, noteIds, isLoaded }
}
