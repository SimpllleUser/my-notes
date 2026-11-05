import { defineStore } from 'pinia'
import type { Nullable } from '@/shared/model/types.ts'
import type { Folder } from './types'
import { folderAPI } from './api'
import type { FolderPayload } from './types'

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
      if (error) throw error
      this.folders = data
    },
    async create(payload: FolderPayload) {
      const result = await folderAPI.create(payload)
      if (result.error) throw result.error
      return result.data
    },
    async update(payload: Folder) {
      const { data, error } = await folderAPI.update(payload)
      if (error) throw error
      return data
    },
    async delete(payload: string) {
      const { data, error } = await folderAPI.delete(payload)
      if (error) throw error
      return data
    },
  },
})
