import type { OutputBlockData } from '@bloklabs/core'
import { nodeAPI } from './api'
import { blockToPayload, rowsToBlocks } from './serialization'
import { unwrap } from '@/shared/api/unwrap.ts'
import { ChangeAction, type NodeOperation } from './types'

/** Ліміт операцій в одній транзакції Appwrite. */
const MAX_OPERATIONS_PER_COMMIT = 100

const toCreateOperation = (noteId: string, block: OutputBlockData, order: number): NodeOperation => ({
  action: ChangeAction.Create,
  rowId: crypto.randomUUID(),
  data: blockToPayload({ block, order }, noteId),
})

/** Зберігає імпортовані блоки в нотатку, зберігаючи їхній порядок. Кидає помилку при невдачі. */
export async function saveImportedBlocks(
  noteId: string,
  blocks: OutputBlockData[],
  firstOrder = 0,
) {
  const operations = blocks.map((block, index) =>
    toCreateOperation(noteId, block, firstOrder + index),
  )

  for (let i = 0; i < operations.length; i += MAX_OPERATIONS_PER_COMMIT) {
    const { error } = await nodeAPI.commit(operations.slice(i, i + MAX_OPERATIONS_PER_COMMIT))
    if (error) throw error
  }
}

/** Дописує імпортовані блоки в кінець наявної нотатки. */
export async function appendImportedBlocks(noteId: string, blocks: OutputBlockData[]) {
  const existing = rowsToBlocks(await unwrap(nodeAPI.getAll(noteId)))
  const firstOrder = existing.length ? Math.max(...existing.map(({ order }) => order)) + 1 : 0
  await saveImportedBlocks(noteId, blocks, firstOrder)
}
