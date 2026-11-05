import type { Folder } from '@/entities/folder'
import type { Note } from '@/entities/note'

export enum FileEntityTypes {
  File = 'file',
  Folder = 'folder',
}

export enum ExplorerFormMode {
  Create = 'create',
  Edit = 'edit',
}

export enum ExplorerItemAction {
  Edit = 'edit',
  Delete = 'delete',
}

export type ExplorerSavePayload =
  | { type: FileEntityTypes.Folder; name: string; color: string; icon: string }
  | { type: FileEntityTypes.File; name: string }

export type ExplorerEntity =
  | { type: FileEntityTypes.Folder; entity: Folder }
  | { type: FileEntityTypes.File; entity: Note }
