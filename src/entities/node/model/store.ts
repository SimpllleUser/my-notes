import { defineStore } from 'pinia'
import type { Nullable } from '@/shared/model/types.ts'
import { nodeAPI } from '@/entities/node/model/api.ts'
import type { Node, NodePayload } from '@/entities/node/model/types.ts'

export const useNodesStore = defineStore('nodes', {
  state: () =>
    ({
      nodes: null,
    }) as {
      nodes: Nullable<Node[]>
    },
  getters: {

  },
  actions: {
    async getAll(noteId: string): Promise<Node[] | null> {
      const { data } = await nodeAPI.getAll(noteId)
      this.nodes = data
      return data
    },
    async create(payload: NodePayload) {
      await nodeAPI.create(payload)
    },
    async update(rowId: string, payload: NodePayload) {
      await nodeAPI.update(rowId, payload)
    },
    async delete(payload: string) {
      await nodeAPI.delete(payload)
    },
  },
})
