import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { JSONContent } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorRef } from './types'

export type BlockGutter = { top: number; left: number }
export type BlockMenuPosition = { top: number; left: number }
export type DropLine = { top: number; left: number; width: number }

type BlockDom = { el: HTMLElement; index: number }

const MENU_WIDTH = 240
const MENU_HEIGHT = 430
const HIDE_DELAY_MS = 300

/** Позиція початку top-level блока doc (перший блок починається з 0). */
function childPos(doc: ProseMirrorNode, index: number) {
  let pos = 0
  for (let i = 0; i < index; i++) pos += doc.child(i).nodeSize
  return pos
}

/** Прибирає `id` з клонів, щоб UniqueID не отримував дублікати. */
function stripIds(node: JSONContent) {
  if (node.attrs?.id !== undefined) delete node.attrs.id
  node.content?.forEach(stripIds)
}

/**
 * Неонові «гуттери» блоку у стилі Notion: кнопки «+» та маркер перетягування,
 * що з'являються ліворуч від блоку при наведенні, меню блоку
 * (перетворити/дублювати/видалити) та drag & drop блоків із синім індикатором.
 */
export function useBlockHandles(
  editor: EditorRef,
  bodyRef: Ref<HTMLElement | null>,
  onAddBlock: () => void,
) {
  const gutter = ref<BlockGutter | null>(null)
  const menu = ref<BlockMenuPosition | null>(null)
  const dropLine = ref<DropLine | null>(null)
  const gutterEl = ref<HTMLElement | null>(null)
  const menuEl = ref<HTMLElement | null>(null)
  const dragging = ref(false)

  let hovered: BlockDom | null = null
  let menuIndex = -1
  let dragIndex = -1
  let dropTarget: { index: number; after: boolean } | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  function resolveBlock(target: EventTarget | null): BlockDom | null {
    const pm = editor.value?.view.dom
    if (!pm || !(target instanceof Element) || !pm.contains(target)) return null
    let el: Element | null = target
    while (el && el.parentElement !== pm) el = el.parentElement
    if (!el) return null
    const index = Array.prototype.indexOf.call(pm.children, el)
    return index < 0 ? null : { el: el as HTMLElement, index }
  }

  function showGutter(block: BlockDom) {
    const body = bodyRef.value
    if (!body) return
    hovered = block
    const bodyRect = body.getBoundingClientRect()
    const blockRect = block.el.getBoundingClientRect()
    gutter.value = {
      top: Math.max(0, blockRect.top - bodyRect.top),
      left: Math.max(2, blockRect.left - bodyRect.left - 30),
    }
  }

  function hideGutter() {
    if (menu.value || dragging.value) return
    hovered = null
    gutter.value = null
  }

  function cancelHide() {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function scheduleHide() {
    cancelHide()
    hideTimer = setTimeout(hideGutter, HIDE_DELAY_MS)
  }

  function onMousemove(event: MouseEvent) {
    // Наведення на сам гуттер або тримання його відкритим (затримка перед зникненням).
    if (gutterEl.value?.contains(event.target as globalThis.Node)) {
      cancelHide()
      return
    }
    const block = resolveBlock(event.target)
    if (block) {
      cancelHide()
      showGutter(block)
    } else {
      scheduleHide()
    }
  }

  function onMouseleave() {
    cancelHide()
    hideGutter()
  }

  /** Вставляє порожній абзац нижче блоку й відкриває slash-меню (як у Notion). */
  function addBlock() {
    const instance = editor.value
    const block = hovered
    closeMenu()
    if (!instance || !block) return
    const doc = instance.state.doc
    if (block.index >= doc.childCount) return
    const insertPos = childPos(doc, block.index) + doc.child(block.index).nodeSize
    instance
      .chain()
      .focus()
      .insertContentAt(insertPos, { type: 'paragraph' })
      .setTextSelection(insertPos + 1)
      .run()
    onAddBlock()
  }

  function openMenu() {
    if (menu.value) {
      closeMenu()
      return
    }
    const block = hovered
    const body = bodyRef.value
    if (!block || !body) return
    menuIndex = block.index
    cancelHide()
    const blockRect = block.el.getBoundingClientRect()
    const bodyRect = body.getBoundingClientRect()
    menu.value = {
      top: Math.max(8, Math.min(blockRect.top, window.innerHeight - MENU_HEIGHT - 8)),
      left: Math.max(
        8,
        Math.min(bodyRect.left + (gutter.value?.left ?? 4), window.innerWidth - MENU_WIDTH - 8),
      ),
    }
  }

  function closeMenu() {
    menu.value = null
    menuIndex = -1
  }

  function currentBlock() {
    const instance = editor.value
    if (!instance || menuIndex < 0 || menuIndex >= instance.state.doc.childCount) return null
    const doc = instance.state.doc
    const pos = childPos(doc, menuIndex)
    return { pos, size: doc.child(menuIndex).nodeSize, node: doc.child(menuIndex) }
  }

  function duplicateBlock() {
    const instance = editor.value
    const block = currentBlock()
    closeMenu()
    hideGutter()
    if (!instance || !block) return
    const json = block.node.toJSON()
    stripIds(json)
    instance
      .chain()
      .focus()
      .insertContentAt(block.pos + block.size, json)
      .run()
  }

  function deleteBlock() {
    const instance = editor.value
    const block = currentBlock()
    closeMenu()
    hideGutter()
    if (!instance || !block) return
    if (instance.state.doc.childCount === 1) {
      instance
        .chain()
        .focus()
        .setContent({ type: 'doc', content: [{ type: 'paragraph' }] })
        .run()
      return
    }
    instance
      .chain()
      .focus()
      .deleteRange({ from: block.pos, to: block.pos + block.size })
      .run()
  }

  function resetDrag() {
    dragging.value = false
    dragIndex = -1
    dropTarget = null
    dropLine.value = null
  }

  function moveDragged() {
    const instance = editor.value
    const target = dropTarget
    const from = dragIndex
    resetDrag()
    if (!instance || !target || from < 0) return
    const doc = instance.state.doc
    if (from >= doc.childCount || target.index >= doc.childCount || from === target.index) return

    const startPos = childPos(doc, from)
    const size = doc.child(from).nodeSize
    let insertPos =
      childPos(doc, target.index) + (target.after ? doc.child(target.index).nodeSize : 0)
    if (insertPos > startPos) insertPos -= size

    const json = doc.child(from).toJSON()
    instance
      .chain()
      .focus()
      .deleteRange({ from: startPos, to: startPos + size })
      .insertContentAt(insertPos, json)
      .run()
    hovered = null
    gutter.value = null
  }

  function onDragstart(event: DragEvent) {
    const block = hovered
    if (!block || !event.dataTransfer) {
      event.preventDefault()
      return
    }
    closeMenu()
    dragIndex = block.index
    dragging.value = true
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(block.index))
  }

  function onDragover(event: DragEvent) {
    if (!dragging.value) return
    const block = resolveBlock(event.target)
    const body = bodyRef.value
    if (!block || !body) {
      dropLine.value = null
      return
    }
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    const rect = block.el.getBoundingClientRect()
    const bodyRect = body.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    dropTarget = { index: block.index, after }
    dropLine.value = {
      top: (after ? rect.bottom : rect.top) - bodyRect.top,
      left: rect.left - bodyRect.left,
      width: rect.width,
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    moveDragged()
  }

  function onDragend() {
    resetDrag()
  }

  function onDocumentMousedown(event: MouseEvent) {
    const target = event.target as globalThis.Node | null
    if (menuEl.value?.contains(target) || gutterEl.value?.contains(target)) return
    closeMenu()
  }

  watch(menu, (position) => {
    if (position) document.addEventListener('mousedown', onDocumentMousedown)
    else document.removeEventListener('mousedown', onDocumentMousedown)
  })

  onBeforeUnmount(() => {
    cancelHide()
    document.removeEventListener('mousedown', onDocumentMousedown)
  })

  return {
    gutter,
    menu,
    dropLine,
    gutterEl,
    menuEl,
    dragging,
    onMousemove,
    onMouseleave,
    addBlock,
    openMenu,
    closeMenu,
    hideGutter,
    duplicateBlock,
    deleteBlock,
    onDragstart,
    onDragover,
    onDrop,
    onDragend,
  }
}
