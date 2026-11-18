import { tablesDB } from '@/shared/api/appwrite.ts'
import { ID, type Models, Query, type TablesDB } from 'appwrite'
import type { APIResponse } from '@/shared/model/types.ts'
import type { Node } from '@/entities/node'
import {
  ChangeAction,
  type NodeOperation,
  type NodePayload,
} from '@/entities/node/model/types.ts'

const PAGE_SIZE = 100

export class NodeAPI {
  tablesDB: TablesDB
  databaseId: string = import.meta.env.VITE_APPWRITE_DATABASE_ID
  tableId: string = import.meta.env.VITE_APPWRITE_COLLECTION_NODE_ID

  constructor(databases: TablesDB) {
    this.tablesDB = databases
  }
  async getAll(noteId: string): APIResponse<Node[]> {
    try {
      const all: Node[] = []
      let cursor: string | undefined

      while (true) {
        const { rows }: Models.RowList<Node> = await this.tablesDB.listRows({
          databaseId: this.databaseId,
          tableId: this.tableId,
          queries: [
            Query.equal('note', noteId),
            Query.orderAsc('$createdAt'),
            Query.limit(PAGE_SIZE),
            ...(cursor ? [Query.cursorAfter(cursor)] : []),
          ],
        })
        all.push(...rows)
        if (rows.length < PAGE_SIZE) break
        cursor = rows[rows.length - 1]!.$id
      }

      return { data: all, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Застосовує пачку змін. Одна операція — звичайний запит; кілька — одна атомарна
   * транзакція (3 запити незалежно від розміру пачки).
   */
  async commit(operations: NodeOperation[]): APIResponse<boolean> {
    if (operations.length === 1) return this.commitSingle(operations[0]!)

    let transactionId: string | undefined
    try {
      const transaction = await this.tablesDB.createTransaction()
      transactionId = transaction.$id
      await this.tablesDB.createOperations({
        transactionId,
        operations: operations.map((operation) => ({
          ...operation,
          databaseId: this.databaseId,
          tableId: this.tableId,
        })),
      })
      await this.tablesDB.updateTransaction({ transactionId, commit: true })
      return { data: true, error: null }
    } catch (error) {
      if (transactionId) {
        void this.tablesDB.updateTransaction({ transactionId, rollback: true }).catch(() => {})
      }
      return { data: null, error }
    }
  }

  private async commitSingle(operation: NodeOperation): APIResponse<boolean> {
    const target = { databaseId: this.databaseId, tableId: this.tableId, rowId: operation.rowId }
    try {
      if (operation.action === ChangeAction.Create) {
        await this.tablesDB.createRow({ ...target, data: operation.data })
      } else if (operation.action === ChangeAction.Update) {
        await this.tablesDB.updateRow({ ...target, data: operation.data })
      } else {
        await this.tablesDB.deleteRow(target)
      }
      return { data: true, error: null }
    } catch (error) {
      return { data: null, error }
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
