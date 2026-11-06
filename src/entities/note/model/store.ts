import { defineStore } from 'pinia'
import type { Nullable } from '@/shared/model/types.ts'
import { noteAPI } from './api'
import type { Note, NotePayload } from './types'

export const useNotesStore = defineStore('notes', {
  state: () =>
    ({
      notes: null,
      noteByFolders: {},
    }) as {
      notes: Nullable<Note[]>
      noteByFolders: Record<string, Note[]>
    },
  getters: {
    getNoteByFolder: (state) => (folderId: string) => {
      const existKey = folderId in state.noteByFolders
      if (!folderId || !existKey) return []
      return state.noteByFolders[folderId] ?? []
    },
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
    async getByFolder(folderIds: string[]) {
      const result = await Promise.all(
        folderIds.map(async (folderId) => {
          const { data, error } = await noteAPI.getAll(folderId)
          if (error) throw error
          return [folderId, data ?? []] as const
        }),
      )
      this.noteByFolders = Object.fromEntries(result)
    },
    async getAll(folderId: string): Promise<void> {
      const { data, error } = await noteAPI.getAll(folderId)
      if (error) throw error
      this.notes = data
    },
    async create(payload: NotePayload) {
      const result = await noteAPI.create(payload)
      if (result.error) throw result.error
      return result.data
    },
    async update(payload: Note) {
      const { data, error } = await noteAPI.update(payload)
      if (error) throw error
      return data
    },
    async delete(payload: string) {
      const { data, error } = await noteAPI.delete(payload)
      if (error) throw error
      return data
    },
  },
})
