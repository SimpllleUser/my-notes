interface IFolder {
  name: string
  color: string
  icon: string
  // count: number
}

import type { BaseEntity } from '@/shared/model/types.ts'

export type Folder = BaseEntity<IFolder>

export interface FolderPayload {
  name: string
  color: string
  icon: string
}

/** Спрощена форма папки для рендерингу (tile/sidebar) — без полів Appwrite. */
export interface FolderTileData {
  name: string
  color: string
  icon: string
  count?: number
}
