import { Node, mergeAttributes } from '@tiptap/core'
import type { Editor } from '@tiptap/core'

const DEFAULT_TITLE = 'Toggle'

function updateNodeAttrs(
  editor: Editor,
  getPos: () => number | undefined,
  partial: Record<string, unknown>,
) {
  const pos = getPos()
  if (typeof pos !== 'number') return
  const liveNode = editor.state.doc.nodeAt(pos)
  if (!liveNode) return
  editor.view.dispatch(
    editor.view.state.tr.setNodeMarkup(pos, undefined, { ...liveNode.attrs, ...partial }),
  )
}

export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      title: {
        default: DEFAULT_TITLE,
        parseHTML: (element) =>
          element.getAttribute('data-title') ??
          element.querySelector('summary')?.textContent ??
          DEFAULT_TITLE,
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
      open: {
        default: true,
        parseHTML: (element) =>
          element.hasAttribute('data-open')
            ? element.getAttribute('data-open') !== 'false'
            : element.hasAttribute('open'),
        renderHTML: (attrs) => ({ 'data-open': attrs.open ? 'true' : 'false' }),
      },
    }
  },
  parseHTML() {
    const contentElement = (element: HTMLElement) =>
      element.querySelector<HTMLElement>(':scope > .toggle-content') ?? element
    return [
      { tag: 'div[data-type="toggle"]', contentElement },
      { tag: 'details[data-type="toggle"]', contentElement },
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }),
      [
        'div',
        { class: 'toggle-header' },
        ['span', { class: 'toggle-caret', 'aria-hidden': 'true' }, node.attrs.open ? '▾' : '▸'],
        ['span', { class: 'toggle-title' }, node.attrs.title || DEFAULT_TITLE],
      ],
      ['div', { class: 'toggle-content' }, 0],
    ]
  },
  // A native <details>/<summary> doesn't reliably toggle when nested inside a
  // contenteditable region (clicks get swallowed by ProseMirror's selection
  // handling), and it always starts collapsed, hiding newly inserted content.
  // A node view with a plain div + manually managed `open` attr avoids both.
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div')
      const header = document.createElement('div')
      const caret = document.createElement('button')
      const titleInput = document.createElement('input')
      const content = document.createElement('div')

      dom.className = 'toggle-block'
      header.className = 'toggle-header'
      header.contentEditable = 'false'
      caret.type = 'button'
      caret.className = 'toggle-caret'
      caret.setAttribute('aria-label', 'Згорнути або розгорнути блок')
      titleInput.type = 'text'
      titleInput.className = 'toggle-title'
      titleInput.placeholder = DEFAULT_TITLE
      content.className = 'toggle-content'

      let isOpen = node.attrs.open

      const render = (currentNode: typeof node) => {
        const { open, title } = currentNode.attrs
        isOpen = open
        dom.dataset.open = String(open)
        caret.textContent = open ? '▾' : '▸'
        content.style.display = open ? '' : 'none'
        if (document.activeElement !== titleInput && titleInput.value !== title) {
          titleInput.value = title
        }
      }

      const setAttrs = (partial: Record<string, unknown>) => {
        if (typeof getPos === 'function') updateNodeAttrs(editor, getPos, partial)
      }

      caret.addEventListener('mousedown', (event) => event.preventDefault())
      caret.addEventListener('click', () => setAttrs({ open: !isOpen }))
      titleInput.addEventListener('mousedown', (event) => event.stopPropagation())
      titleInput.addEventListener('input', () => setAttrs({ title: titleInput.value }))

      header.append(caret, titleInput)
      dom.append(header, content)
      render(node)

      return {
        dom,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false
          render(updatedNode)
          return true
        },
      }
    }
  },
})
