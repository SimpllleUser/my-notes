import type { FileEntityTypes, Folder } from '@/entities/folder'
import type { Note } from '@/entities/note'

export enum ExplorerFormMode {
  Create = 'create',
  Edit = 'edit',
}

export enum ExplorerItemAction {
  Edit = 'edit',
  Delete = 'delete',
}

export interface ExplorerCreatePayload {
  name: string
  type: FileEntityTypes
  color: string
  icon: string
}

export type ExplorerEntity =
  | { type: FileEntityTypes.Folder; entity: Folder }
  | { type: FileEntityTypes.File; entity: Note }
