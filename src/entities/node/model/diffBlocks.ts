import type { JSONContent } from '@tiptap/vue-3'
import { getBlockId } from './blocks'

export type BlockChange =
  | { action: 'create'; block: JSONContent }
  | { action: 'update'; block: JSONContent }
  | { action: 'delete'; blockId: string }

const isSameBlock = (a: JSONContent, b: JSONContent) => JSON.stringify(a) === JSON.stringify(b)

/** Чиста функція: що треба зробити на сервері, щоб `committed` став `current`. */
export function diffBlocks(
  committed: ReadonlyMap<string, JSONContent>,
  current: JSONContent[],
): BlockChange[] {
  const changes: BlockChange[] = []
  const seen = new Set<string>()

  for (const block of current) {
    const id = getBlockId(block)
    if (!id || seen.has(id)) continue
    seen.add(id)

    const before = committed.get(id)
    if (!before) changes.push({ action: 'create', block })
    else if (!isSameBlock(before, block)) changes.push({ action: 'update', block })
  }

  for (const id of committed.keys()) {
    if (!seen.has(id)) changes.push({ action: 'delete', blockId: id })
  }

  return changes
}
