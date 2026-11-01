import { defineStore } from 'pinia'
import type { Nullable } from '@/shared/model/types.ts'
import { noteAPI } from '@/entities/note/model/api.ts'
import type { Note } from '@/entities/note'
import type { NotePayload } from '@/entities/note/model/types.ts'
import { data } from 'autoprefixer'

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
    noteList: (state) => state.notes || [],
    getNoteByFolder: (state) => (folderId: string) => {
      const existKey = folderId in state.noteByFolders
      if (!folderId || !existKey) return []
      return state.noteByFolders[folderId]
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
          const {data} = await noteAPI.getAll(folderId)
          return [
            folderId,data || []
          ]
        })
      )
      this.noteByFolders = Object.fromEntries(result)
    },
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
