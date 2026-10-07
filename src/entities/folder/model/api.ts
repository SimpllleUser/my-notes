import { tablesDB } from '@/shared/api/appwrite.ts'
import { ID, type Models, type TablesDB } from 'appwrite'
import type { Folder, FolderPayload } from '@/entities/folder/model/types.ts'
import type { APIResponse } from '@/shared/model/types.ts'

export class FolderAPI {
  tablesDB: TablesDB
  databaseId: string = import.meta.env.VITE_APPWRITE_DATABASE_ID
  tableId: string = import.meta.env.VITE_APPWRITE_COLLECTION_FOLDER_ID

  constructor(databases: TablesDB) {
    this.tablesDB = databases
  }

  async getAll(): APIResponse<Folder[]> {
    try {
      const { rows }: Models.RowList<Folder> = await this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.tableId,
        queries: [],
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

  async create(payload: FolderPayload): APIResponse<Folder> {
    try {
      const result = await this.tablesDB.createRow<Folder>({
        databaseId: this.databaseId,
        tableId: this.tableId,
        rowId: ID.unique(),
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
  async update(payload: Folder): APIResponse<Folder> {
    try {
      const result = await this.tablesDB.updateRow<Folder>({
        databaseId: this.databaseId,
        tableId: this.tableId,
        rowId: payload.$id,
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

export const folderAPI = new FolderAPI(tablesDB)
