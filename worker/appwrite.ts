import type { Env } from './env'

/** Мінімальний REST-клієнт Appwrite (TablesDB) для Worker: авторизація через серверний API key. */

export interface Row {
  $id: string
  $createdAt: string
  $updatedAt: string
  [key: string]: unknown
}

const PAGE_SIZE = 100

export const q = {
  equal: (attribute: string, value: string) =>
    JSON.stringify({ method: 'equal', attribute, values: [value] }),
  contains: (attribute: string, value: string) =>
    JSON.stringify({ method: 'contains', attribute, values: [value] }),
  orderAsc: (attribute: string) => JSON.stringify({ method: 'orderAsc', attribute }),
  limit: (n: number) => JSON.stringify({ method: 'limit', values: [n] }),
  cursorAfter: (id: string) => JSON.stringify({ method: 'cursorAfter', values: [id] }),
}

export class AppwriteTable {
  constructor(
    private env: Env,
    private tableId: string,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}, query?: string[]): Promise<T> {
    const { env } = this
    const base = `${env.APPWRITE_ENDPOINT.replace(/\/$/, '')}/tablesdb/${env.APPWRITE_DATABASE_ID}/tables/${this.tableId}/rows`
    const params = new URLSearchParams()
    query?.forEach((item) => params.append('queries[]', item))
    const url = `${base}${path}${params.size ? `?${params}` : ''}`

    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': env.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': env.APPWRITE_API_KEY,
        ...init.headers,
      },
    })
    if (!response.ok) {
      throw new Error(`Appwrite ${response.status}: ${(await response.text()).slice(0, 300)}`)
    }
    return (await response.json()) as T
  }

  async list(queries: string[] = []): Promise<Row[]> {
    const { rows } = await this.request<{ rows: Row[] }>('', {}, queries)
    return rows
  }

  /** Усі рядки з пагінацією курсором. */
  async listAll(queries: string[] = []): Promise<Row[]> {
    const all: Row[] = []
    let cursor: string | undefined
    for (;;) {
      const rows = await this.list([
        ...queries,
        q.orderAsc('$createdAt'),
        q.limit(PAGE_SIZE),
        ...(cursor ? [q.cursorAfter(cursor)] : []),
      ])
      all.push(...rows)
      if (rows.length < PAGE_SIZE) return all
      cursor = rows[rows.length - 1]!.$id
    }
  }

  get(rowId: string): Promise<Row> {
    return this.request<Row>(`/${encodeURIComponent(rowId)}`)
  }

  update(rowId: string, data: Record<string, unknown>): Promise<Row> {
    return this.request<Row>(`/${encodeURIComponent(rowId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    })
  }

  async delete(rowId: string): Promise<void> {
    await this.request<unknown>(`/${encodeURIComponent(rowId)}`, { method: 'DELETE' })
  }

  create(data: Record<string, unknown>): Promise<Row> {
    const permissions = this.env.OWNER_USER_ID
      ? ['read', 'update', 'delete'].map((action) => `${action}("user:${this.env.OWNER_USER_ID}")`)
      : undefined
    return this.request<Row>('', {
      method: 'POST',
      body: JSON.stringify({ rowId: 'unique()', data, ...(permissions ? { permissions } : {}) }),
    })
  }
}
