import type { OutputBlockData } from '@bloklabs/core'
import type { BlockEntry } from './diffBlocks'
import type { Node, NodePayload } from './types'

export interface LoadedBlock extends BlockEntry {
  rowId: string
}

/** Рядок для Appwrite: блок Blok + `order` (позиція зберігається разом із блоком). */
export const blockToPayload = (entry: BlockEntry, noteId: string): NodePayload => ({
  note: noteId,
  body: JSON.stringify({ ...entry.block, order: entry.order }),
})

// ——— Читання ———

const isBlock = (value: any): value is OutputBlockData =>
  !!value && typeof value.type === 'string' && typeof value.data === 'object' && value.data !== null

const textOf = (node: any): string => node?.text ?? (node?.content ?? []).map(textOf).join('')

/**
 * Рядки, збережені ще Tiptap-ом: переносимо лише текст абзаців і заголовків.
 * Складні блоки (callout, toggle, таблиці) спрощуються до абзацу.
 */
function fromLegacy(raw: any): OutputBlockData {
  const id = raw?.attrs?.id ?? crypto.randomUUID()
  const text = textOf(raw)

  if (raw?.type === 'heading') {
    return { id, type: 'header', data: { text, level: raw.attrs?.level ?? 2 } }
  }
  return { id, type: 'paragraph', data: { text } }
}

/** Розбирає один рядок. Пошкоджений рядок повертає `null` і не ламає решту нотатки. */
function parseRow(row: Node, index: number): LoadedBlock | null {
  try {
    const raw = JSON.parse(row.body)
    const order = Number(raw?.order ?? raw?.attrs?.order ?? index)

    if (isBlock(raw)) {
      const { order: _order, ...block } = raw as OutputBlockData & { order?: number }
      return {
        rowId: row.$id,
        order,
        block: { ...block, id: block.id ?? crypto.randomUUID() },
      }
    }

    return { rowId: row.$id, order, block: fromLegacy(raw) }
  } catch (error) {
    console.warn('Пропущено пошкоджений блок', row.$id, error)
    return null
  }
}

export const rowsToBlocks = (rows: Node[]): LoadedBlock[] =>
  rows
    .map(parseRow)
    .filter((item): item is LoadedBlock => item !== null)
    .sort((a, b) => a.order - b.order)
