import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { JSONContent } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorRef } from './types'
import { Selection } from '@tiptap/pm/state'

export type BlockGutter = { top: number; left: number }
export type BlockMenuPosition = { top: number; left: number }
export type DropLine = { top: number; left: number; width: number }

type BlockDom = { el: HTMLElement; index: number }

const MENU_WIDTH = 240
const MENU_HEIGHT = 430
const HIDE_DELAY_MS = 300
const SCROLL_EDGE_PX = 48
const SCROLL_STEP_PX = 14
const DRAG_MIME = 'application/x-editor-block'
const GUTTER_WIDTH = 52 // «+» (24) + gap (2) + «⋮⋮» (24) + запас
const GUTTER_GAP = 6
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
  let dropSlot: number | null = null // позиція вставки 0..n
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
      left: Math.max(0, blockRect.left - bodyRect.left - GUTTER_WIDTH - GUTTER_GAP),
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
    // Дублікат отримує `order = null`, щоб плагін призначив йому нове значення за місцем.
    if (json.attrs) json.attrs.order = null
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

  function blockElements(): HTMLElement[] {
    const pm = editor.value?.view.dom
    return pm ? (Array.from(pm.children) as HTMLElement[]) : []
  }

  function slotAtY(y: number) {
    const index = blockElements().findIndex((el) => {
      const rect = el.getBoundingClientRect()
      return y < rect.top + rect.height / 2
    })
    return index === -1 ? blockElements().length : index
  }

  function showDropLine(slot: number) {
    const body = bodyRef.value
    const pm = editor.value?.view.dom
    const items = blockElements()
    if (!body || !pm || items.length === 0) {
      dropLine.value = null
      return
    }
    const prev = items[slot - 1]?.getBoundingClientRect()
    const next = items[slot]?.getBoundingClientRect()
    const y = prev && next ? (prev.bottom + next.top) / 2 : (next?.top ?? prev!.bottom)
    const bodyRect = body.getBoundingClientRect()
    const pmRect = pm.getBoundingClientRect()
    dropLine.value = {
      top: y - bodyRect.top,
      left: pmRect.left - bodyRect.left,
      width: pmRect.width,
    }
  }

  function autoScroll(clientY: number) {
    if (clientY < SCROLL_EDGE_PX) window.scrollBy(0, -SCROLL_STEP_PX)
    else if (clientY > window.innerHeight - SCROLL_EDGE_PX) window.scrollBy(0, SCROLL_STEP_PX)
  }

  function resetDrag() {
    dragging.value = false
    dragIndex = -1
    dropSlot = null
    dropLine.value = null
  }

  function moveDragged() {
    const instance = editor.value
    const from = dragIndex
    const slot = dropSlot
    resetDrag()
    if (!instance || slot === null || from < 0) return

    const { state, view } = instance
    const doc = state.doc
    if (from >= doc.childCount) return

    const node = doc.child(from)
    const fromPos = childPos(doc, from)
    const toPos = childPos(doc, slot)
    const insertPos = toPos > fromPos ? toPos - node.nodeSize : toPos

    // `order = null` → BlockOrder призначить дробове значення за новим місцем.
    // `id` лишається, тому на сервері це update, а не delete + create.
    const moved = node.type.create({ ...node.attrs, order: null }, node.content, node.marks)

    const tr = state.tr.delete(fromPos, fromPos + node.nodeSize).insert(insertPos, moved)
    tr.setSelection(Selection.near(tr.doc.resolve(insertPos + 1), 1))
    view.dispatch(tr.scrollIntoView())
    view.focus()

    hovered = null
    gutter.value = null
  }
  function onDragstart(event: DragEvent) {
    const pm = editor.value?.view.dom
    const block = hovered
    const transfer = event.dataTransfer
    if (!pm || !block || !transfer) {
      event.preventDefault()
      return
    }

    closeMenu()
    // Індекс перераховуємо зараз, а не беремо зі значення при наведенні.
    dragIndex = Array.prototype.indexOf.call(pm.children, block.el)
    dragging.value = true

    transfer.effectAllowed = 'move'
    // Власний MIME: ProseMirror не вставить нічого текстом, якщо подія все ж до нього дійде.
    transfer.setData(DRAG_MIME, String(dragIndex))
    transfer.setDragImage(block.el, 0, 0)
  }
  function onDragover(event: DragEvent) {
    if (!dragging.value) return // чужі drag (файли, текст) обробляє сам ProseMirror
    // Забороняємо ProseMirror/Dropcursor реагувати на наш drag.
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'

    autoScroll(event.clientY)

    const slot = slotAtY(event.clientY)
    const isSamePlace = slot === dragIndex || slot === dragIndex + 1
    dropSlot = isSamePlace ? null : slot
    if (dropSlot === null) dropLine.value = null
    else showDropLine(dropSlot)
  }

  function onDragleave(event: DragEvent) {
    if (!dragging.value) return
    const related = event.relatedTarget
    if (related instanceof globalThis.Node && bodyRef.value?.contains(related)) return
    dropSlot = null
    dropLine.value = null
  }
  function onDrop(event: DragEvent) {
    if (!dragging.value) return
    event.preventDefault()
    event.stopPropagation()
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
    onDragleave,
    onDrop,
    onDragend,
  }
}
