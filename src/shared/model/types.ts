export type Nullable<T> = T | null
export type BaseEntity<T> = T & {
  $id: string
  $sequence: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  $databaseId: string
  $tableId: string
}

export type APIResponse<T> = Promise<{
  data: Nullable<T>;
  error: Nullable<unknown>
}>
