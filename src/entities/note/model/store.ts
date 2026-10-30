import { defineStore } from 'pinia'
import type { Nullable } from '@/shared/model/types.ts'
import { noteAPI } from '@/entities/note/model/api.ts'
import type { Note } from '@/entities/note'
import type { NotePayload } from '@/entities/note/model/types.ts'

export const useNotesStore = defineStore('notes', {
  state: () =>
    ({
      notes: null,
    }) as {
      notes: Nullable<Note[]>
    },
  getters: {
    getNotes:
      (state) =>
      (search = '') => {
        if (!state.notes) return []
        if (!search) return state.notes
        return state.notes.filter(({ name }) =>
          name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        )
      },
  },
  actions: {
    async getAll(folderId: string): Promise<void> {
      const { data, error } = await noteAPI.getAll(folderId)
      this.notes = data
      if (error) throw error
    },
    async create(payload: NotePayload) {
      return noteAPI.create(payload)
    },
    async update(payload: Note) {
      return noteAPI.update(payload)
    },
    async delete(payload: string) {
      return noteAPI.delete(payload)
    },
  },
})
