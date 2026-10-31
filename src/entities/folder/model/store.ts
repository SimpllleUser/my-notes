import { defineStore } from 'pinia'
import type { Nullable } from '@/shared/model/types.ts'
import type { Folder } from '@/entities/folder'
import { folderAPI } from '@/entities/folder/model/api.ts'
import type { FolderPayload } from '@/entities/folder/model/types.ts'

export const useFoldersStore = defineStore('folders', {
  state: () =>
    ({
      folders: null,
    }) as {
      folders: Nullable<Folder[]>
    },
  getters: {
    getFolders: (state) => state.folders || [],
    getFolder: (state) => (id: string) => state.folders
      ?.find((folder) => folder.$id === id) || null
  },
  actions: {
    async getAll() {
      const { data, error } = await folderAPI.getAll()
      this.folders = data
    },
    async create(payload: FolderPayload) {
       await folderAPI.create(payload)
    },
    async update(payload: Folder) {
       await folderAPI.update(payload)
    },
    async delete(payload: string) {
       await folderAPI.delete(payload)
    },
  },
})
