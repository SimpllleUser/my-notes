import type { BaseEntity } from '@/shared/model/types.ts'

export type Node = BaseEntity<NodePayload>


export enum ChangeAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

/** Одна операція запису. `rowId` задає клієнт, тому нові рядки відомі без очікування відповіді. */
export type NodeOperation =
  | { action: ChangeAction.Create | ChangeAction.Update; rowId: string; data: NodePayload }
  | { action: ChangeAction.Delete; rowId: string }

export interface NodePayload {
  body: string
  note: string
}
