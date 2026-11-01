import type { OutputBlockData } from '@bloklabs/core'

/** Блок разом з його позицією (дробовий `order`). */
export interface BlockEntry {
  block: OutputBlockData
  order: number
}

export type BlockChange =
  | { action: 'create'; entry: BlockEntry }
  | { action: 'update'; entry: BlockEntry }
  | { action: 'delete'; blockId: string }

const isSameEntry = (a: BlockEntry, b: BlockEntry) =>
  a.order === b.order && JSON.stringify(a.block) === JSON.stringify(b.block)

/**
 * Чиста функція: що треба зробити на сервері, щоб `committed` став `current`.
 * - блок є в `current`, але немає в `committed` → create
 * - блок є в обох, але змінився вміст або order → update
 * - блок є в `committed`, але зник із `current` → delete
 */
export function diffBlocks(
  committed: ReadonlyMap<string, BlockEntry>,
  current: BlockEntry[],
): BlockChange[] {
  const changes: BlockChange[] = []
  const seen = new Set<string>()

  for (const entry of current) {
    const id = entry.block.id
    // Блок без id або дубль id пропускаємо: ідентичність блока тримається на id.
    if (!id || seen.has(id)) continue
    seen.add(id)

    const before = committed.get(id)
    if (!before) changes.push({ action: 'create', entry })
    else if (!isSameEntry(before, entry)) changes.push({ action: 'update', entry })
  }

  for (const id of committed.keys()) {
    if (!seen.has(id)) changes.push({ action: 'delete', blockId: id })
  }

  return changes
}
