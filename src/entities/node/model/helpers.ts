import type { BlockChange } from '@/features/rich-text-editor/model/useBlockSave.ts'
import type { Node } from '@/entities/node'

export const serialize = (node: BlockChange, note: string) => {
  delete node.action
return {
    body: JSON.stringify(node),
  note,
}
}

export const deserialize = (node: Node) => {
  const nodeBody = JSON.parse(node.body)
  return {
    ...nodeBody,
    attrs: {
      ...nodeBody?.attrs,
      $id: node.$id,
    },
  }
}
