export interface Note {
  name: string
  $id: string
  $sequence: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  folder: string
  $databaseId: string
  $tableId: string
}

export interface NotePayload {
  name: string
  folder: string
}
