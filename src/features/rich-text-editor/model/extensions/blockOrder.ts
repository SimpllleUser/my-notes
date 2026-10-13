import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state'

/**
 * Top-level блоки, які підтримують атрибут `order` (порядковий номер блоку в межах doc).
 * Якщо додаєте новий top-level блок — додайте його тип сюди.
 */
const TOP_LEVEL_BLOCK_TYPES = [
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

/**
 * Тримає `order` коректним **у самому документі**, а не лише у відредагованому JSON.
 *
 * `appendTransaction` перенумеровує top-level блоки doc у межах тієї ж транзакції, тому
 * порядок оновлюється після будь-якої зміни структури: drag & drop блоку, дублювання,
 * видалення, вставки, split, paste чи undo/redo.
 */
export const BlockOrder = Extension.create({
  name: 'blockOrder',

  addGlobalAttributes() {
    return [
      {
        types: TOP_LEVEL_BLOCK_TYPES,
        attributes: {
          order: {
            default: 0,
            keepOnSplit: false,
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
          let transaction: Transaction | null = null
          let pos = 0

          for (let index = 0; index < doc.childCount; index++) {
            const node = doc.child(index)
            // `attrs.order` оголошено лише для top-level блоків, тому перевіряємо наявність.
            if ('order' in node.attrs && node.attrs.order !== index) {
              transaction ??= newState.tr
              // Позиція top-level вузла = початок його в doc; зміна attrs не змінює nodeSize,
              // тому наступні позиції залишаються валідними.
              transaction.setNodeAttribute(pos, 'order', index)
            }
            pos += node.nodeSize
          }

          return transaction
        },
      }),
    ]
  },
})
