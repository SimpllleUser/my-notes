export interface Node {
  body: string
  $id: string
  $sequence: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  note: string
  $databaseId: string
  $tableId: string
}

export interface NodePayload {
  name: string
  folder: string
}
