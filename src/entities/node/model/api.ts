import { tablesDB } from '@/shared/api/appwrite.ts'
import { ID, type Models, Query, type TablesDB } from 'appwrite'
import type { APIResponse } from '@/shared/model/types.ts'
import type { Node } from '@/entities/node'
import type { NodePayload } from '@/entities/node/model/types.ts'

export class NodeAPI {
  tablesDB: TablesDB
  databaseId: string = import.meta.env.VITE_APPWRITE_DATABASE_ID
  tableId: string = import.meta.env.VITE_APPWRITE_COLLECTION_NODE_ID

  constructor(databases: TablesDB) {
    this.tablesDB = databases
  }

  async getAll(noteId: string): APIResponse<Node[]> {
    try {
      const { rows }: Models.RowList<Node> = await this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.tableId,
        queries: [Query.equal('note', noteId)],
      })

      return {
        data: rows,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error,
      }
    }
  }

  async create(payload: NodePayload): APIResponse<Node> {
    try {
      const result = await this.tablesDB.createRow<Node>({
        databaseId: this.databaseId,
        tableId: this.tableId,
        rowId: ID.unique(),
        data: payload,
      })

      return { data: result, error: null }
    } catch (error) {
      console.log(error)
      return {
        data: null,
        error,
      }
    }
  }
  async update(rowId: string, payload: NodePayload): APIResponse<Node> {
    try {
      const result = await this.tablesDB.updateRow<Node>({
        databaseId: this.databaseId,
        tableId: this.tableId,
        rowId,
        data: payload,
      })

      return { data: result, error: null }
    } catch (error) {
      return {
        data: null,
        error,
      }
    }
  }

  async delete(payload: string): APIResponse<boolean> {
    try {
      const result = await this.tablesDB.deleteRow({
        databaseId: this.databaseId,
        tableId: this.tableId,
        rowId: payload,
      })

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error,
      }
    }
  }
}

export const nodeAPI = new NodeAPI(tablesDB)
