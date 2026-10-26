import type { BaseEntity } from '@/shared/model/types.ts'

export type Node = BaseEntity<NodePayload>


export interface NodePayload {
  body: string
  note: string
}
