import type { ChainedCommands } from '@tiptap/vue-3'
import type { EditorRef } from './types'

type Alignment = 'left' | 'center' | 'right'

const HIGHLIGHT_COLOR = '#fff3a8'
const DEFAULT_TABLE = { rows: 3, cols: 3, withHeaderRow: true }

/**
 * Команди редактора для тулбара та slash-меню.
 * `beforeBlockCommand` викликається перед командами, що вставляють/міняють блок
 * (напр. щоб закрити slash-меню).
 */
export function useEditorActions(editor: EditorRef, beforeBlockCommand: () => void) {
  function run(command: (chain: ChainedCommands) => ChainedCommands) {
    if (editor.value) command(editor.value.chain().focus()).run()
  }

  function runBlock(command: (chain: ChainedCommands) => ChainedCommands) {
    if (!editor.value) return
    beforeBlockCommand()
    run(command)
  }

  function setLink() {
    if (!editor.value) return
    const previous = editor.value.getAttributes('link').href as string | undefined
    const url = window.prompt('Вставте URL', previous ?? 'https://')
    if (url === null) return
    run((chain) => (url === '' ? chain.unsetLink() : chain.setLink({ href: url })))
  }

  function setAlignment(textAlign: Alignment) {
    const nodeType = editor.value?.isActive('heading') ? 'heading' : 'paragraph'
    run((chain) => chain.updateAttributes(nodeType, { textAlign }))
  }

  return {
    toggleBold: () => run((chain) => chain.toggleBold()),
    toggleItalic: () => run((chain) => chain.toggleItalic()),
    toggleUnderline: () => run((chain) => chain.toggleUnderline()),
    toggleStrike: () => run((chain) => chain.toggleStrike()),
    toggleHighlight: () =>
      run((chain) => chain.toggleMark('highlight', { color: HIGHLIGHT_COLOR })),
    undo: () => run((chain) => chain.undo()),
    redo: () => run((chain) => chain.redo()),
    setLink,
    setAlignment,

    setHeading: (level: 1 | 2 | 3) => runBlock((chain) => chain.toggleHeading({ level })),
    toggleBulletList: () => runBlock((chain) => chain.toggleBulletList()),
    toggleOrderedList: () => runBlock((chain) => chain.toggleOrderedList()),
    toggleTaskList: () => runBlock((chain) => chain.toggleTaskList()),
    toggleBlockquote: () => runBlock((chain) => chain.toggleBlockquote()),
    toggleCodeBlock: () => runBlock((chain) => chain.toggleCodeBlock()),
    insertDivider: () => runBlock((chain) => chain.setHorizontalRule()),
    insertCallout: () =>
      runBlock((chain) =>
        chain.insertContent({
          type: 'callout',
          attrs: { emoji: '💡', tone: 'yellow' },
          content: [{ type: 'paragraph' }],
        }),
      ),
    insertToggle: () =>
      runBlock((chain) =>
        chain.insertContent({ type: 'toggle', content: [{ type: 'paragraph' }] }),
      ),
    insertTable: () => runBlock((chain) => chain.insertTable(DEFAULT_TABLE)),

    addRowAfter: () => run((chain) => chain.addRowAfter()),
    addColumnAfter: () => run((chain) => chain.addColumnAfter()),
    deleteRow: () => run((chain) => chain.deleteRow()),
    deleteColumn: () => run((chain) => chain.deleteColumn()),
    deleteTable: () => run((chain) => chain.deleteTable()),
  }
}

export type EditorActions = ReturnType<typeof useEditorActions>
