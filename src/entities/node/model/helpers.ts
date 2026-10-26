import type { BlockChange } from '@/features/rich-text-editor/model/useBlockSave.ts'
import type { Node } from '@/entities/node'

export const serialize = (node: BlockChange, note: string) => {
  const block = { ...node }
  delete block.action
  return {
    body: JSON.stringify(block),
    note,
  }
}

export const deserialize = (node: Node) => {
  const nodeBody = JSON.parse(node.body)
  return {
    ...nodeBody,
    attrs: {
      ...nodeBody?.attrs,
      nodeId: node.$id,
    },
  }
}
