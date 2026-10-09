import { tablesDB } from '@/shared/api/appwrite.ts'
import { ID, type Models, Query, type TablesDB } from 'appwrite'
import type { FolderPayload } from '@/entities/folder/model/types.ts'
import type { APIResponse } from '@/shared/model/types.ts'
import type { Note } from '@/entities/note'
import type { NotePayload } from '@/entities/note/model/types.ts'

export class NoteAPI {
  tablesDB: TablesDB
  databaseId: string = import.meta.env.VITE_APPWRITE_DATABASE_ID
  tableId: string = import.meta.env.VITE_APPWRITE_COLLECTION_NOTE_ID

  constructor(databases: TablesDB) {
    this.tablesDB = databases
  }

  async getAll(folderId: string): APIResponse<Note[]> {
    try {
      const { rows }: Models.RowList<Note> = await this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.tableId,
        queries: [
          Query.equal('folder', folderId)],
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

  async create(payload: NotePayload): APIResponse<Note> {
    try {
      const result = await this.tablesDB.createRow<Note>({
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
  async update(payload: Note): APIResponse<Note> {
    try {
      const result = await this.tablesDB.updateRow<Note>({
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

export const noteAPI = new NoteAPI(tablesDB)
