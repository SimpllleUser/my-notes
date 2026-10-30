import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, type Transaction, type EditorState } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * Top-level блоки, які підтримують атрибут `order` (фракційний ключ сортування блоку).
 * Якщо додаєте новий top-level блок — додайте його тип сюди.
 */
export const TOP_LEVEL_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'taskList',
  'codeBlock',
  'horizontalRule',
  'table',
  'callout',
  'toggle',
]

/** Числовий `order` вузла або `null`, якщо він ще не призначений. */
function readOrder(node: ProseMirrorNode): number | null {
  const value = node.attrs.order
  return typeof value === 'number' ? value : null
}

/**
 * Дробове значення `order` між сусідами `prev`/`next` (`null` = межа doc).
 * Повертає `null`, коли між сусідами більше немає місця (вичерпано точність коми).
 */
function fractionalOrder(prev: number | null, next: number | null): number | null {
  if (prev === null && next === null) return 0
  // На початку doc — від'ємний крок, щоб лишити місце для повторних «у початок».
  if (prev === null) return (next as number) - 1
  if (next === null) return prev + 1
  const mid = (prev + next) / 2
  return mid > prev && mid < next ? mid : null
}

/**
 * Повна перенумерація у щільний `0..n-1`. Використовується лише як рідкий fallback,
 * коли порядок зламано або вичерпано точність дробового `order`.
 */
function renumber(state: EditorState): Transaction {
  const transaction = state.tr
  const doc = state.doc
  let pos = 0
  for (let index = 0; index < doc.childCount; index++) {
    transaction.setNodeAttribute(pos, 'order', index)
    pos += doc.child(index).nodeSize
  }
  return transaction
}

/**
 * Тримає `order` коректним **у самому документі** як фракційний ключ сортування.
 *
 * На відміну від щільної нумерації, плагін призначає `order` лише блокам зі значенням
 * `null` (нові, розділені, дубльовані чи переміщені), обчислюючи дробове значення між
 * сусідами. Тому drag & drop або видалення оновлюють `order` тільки в блоків, які реально
 * змінили місце, — а не перенумеровують увесь doc. Якщо точність коми вичерпано, виконується
 * повна перенумерація (рідко).
 */
export const BlockOrder = Extension.create({
  name: 'blockOrder',

  addGlobalAttributes() {
    return [
      {
        types: TOP_LEVEL_BLOCK_TYPES,
        attributes: {
          order: {
            // `null` = «потребує призначення»; плагін нижче проставить дробове значення.
            default: null,
            // Розділений блок (Enter) не успадковує order — отримує `null` і нове значення.
            keepOnSplit: false,
            // Не виводимо атрибут у HTML (data-order не потрібен).
            rendered: false,
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockOrder'),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged)) return null

          const doc = newState.doc
          const count = doc.childCount
          if (count === 0) return null

          const orders: (number | null)[] = []
          for (let index = 0; index < count; index++) orders.push(readOrder(doc.child(index)))

          const hasUnassigned = orders.some((order) => order === null)

          // Перевіряємо, чи наявні `order` строго зростають у межах doc.
          let monotonic = true
          for (let index = 1; index < count; index++) {
            const prev = orders[index - 1] ?? null
            const current = orders[index] ?? null
            if (prev !== null && current !== null && prev >= current) {
              monotonic = false
              break
            }
          }

          // Нічого призначати і порядок коректний — виходимо без транзакції.
          if (!hasUnassigned && monotonic) return null
          // Порядок зламаний (неправильний стан) — повна перенумерація.
          if (!monotonic) return renumber(newState)

          // Є блоки без `order` і порядок коректний → дробове призначення лише для них.
          const transaction = newState.tr
          let pos = 0
          for (let index = 0; index < count; index++) {
            const nodeSize = doc.child(index).nodeSize
            if ((orders[index] ?? null) === null) {
              const prev = index > 0 ? (orders[index - 1] ?? null) : null
              // Найближчий наступний уже призначений `order` (межа для дробового значення).
              let next: number | null = null
              for (let ahead = index + 1; ahead < count; ahead++) {
                const aheadOrder = orders[ahead] ?? null
                if (aheadOrder !== null) {
                  next = aheadOrder
                  break
                }
              }
              const value = fractionalOrder(prev, next)
              // Вичерпано точність коми між сусідами — вдаємося до повної перенумерації.
              if (value === null) return renumber(newState)
              transaction.setNodeAttribute(pos, 'order', value)
              // Фіксуємо значення, щоб наступні блоки бачили його як `prev`.
              orders[index] = value
            }
            pos += nodeSize
          }

          return transaction
        },
      }),
    ]
  },
})
