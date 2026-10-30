import type { JSONContent } from '@tiptap/vue-3'
import type { Node, NodePayload } from './types'

export interface LoadedBlock {
  rowId: string
  block: JSONContent
}

export function blockToPayload(block: JSONContent, noteId: string): NodePayload {
  return { note: noteId, body: JSON.stringify(block) }
}

function rowToBlock(row: Node): JSONContent {
  const { type, attrs, content } = JSON.parse(row.body) as JSONContent
  // `nodeId` — застарілий атрибут: id рядка тепер зберігається в сесії синку.
  const { nodeId: _legacy, ...rest } = attrs ?? {}
  return {
    type,
    attrs: { ...rest, id: rest.id ?? crypto.randomUUID() },
    ...(content ? { content } : {}),
  }
}

const orderOf = ({ block }: LoadedBlock) => Number(block.attrs?.order ?? 0)

export function rowsToBlocks(rows: Node[]): LoadedBlock[] {
  return rows
    .map((row) => ({ rowId: row.$id, createdAt: row.$createdAt, block: rowToBlock(row) }))
    .sort((a, b) => orderOf(a) - orderOf(b) || a.createdAt.localeCompare(b.createdAt))
    .map(({ rowId, block }) => ({ rowId, block }))
}
