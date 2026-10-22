import { onBeforeUnmount, ref } from 'vue'
import { TextSelection } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorRef } from './types'

/** Позиція початку top-level блока doc. */
function childPos(doc: ProseMirrorNode, index: number) {
  let pos = 0
  for (let i = 0; i < index; i++) pos += doc.child(i).nodeSize
  return pos
}

/** Індекс top-level блока, що містить вказану позицію. */
function childIndexAt(doc: ProseMirrorNode, pos: number) {
  let offset = 0
  for (let i = 0; i < doc.childCount; i++) {
    const size = doc.child(i).nodeSize
    if (pos < offset + size) return i
    offset += size
  }
  return doc.childCount - 1
}

/**
 * Клік по порожньому місці під останнім блоком одразу переносить каретку
 * туди, де користувач натиснув (наприклад, на 20-й рядок), і дозволяє
 * писати без ручного набивання порожніх абзаців.
 *
 * Під останній блок додаються порожні абзаци, щоб каретка візуально
 * стояла на потрібному рядку. Якщо користувач нічого не написав, ці
 * абзаци прибираються під час втрати фокуса.
 */
export function useClickToAppend(editor: EditorRef) {
  /** id-и порожніх абзаців, які ми додали (щоб прибрати лише їх). */
  const appendedIds = ref<string[]>([])

  /** Висота одного рядка разом із вертикальними відступами абзацу. */
  function lineBoxHeight(): number {
    const block = editor.value?.view.dom?.lastElementChild
    if (!(block instanceof HTMLElement)) return 24
    const style = getComputedStyle(block)
    const lineHeight = parseFloat(style.lineHeight)
    const marginTop = parseFloat(style.marginTop) || 0
    const marginBottom = parseFloat(style.marginBottom) || 0
    const height = Number.isNaN(lineHeight) ? 24 : lineHeight
    return height + marginTop + marginBottom
  }

  /** Нижня межа останнього блоку у координатах viewport. */
  function lastBlockBottom(): number | null {
    const last = editor.value?.view.dom?.lastElementChild
    if (!last) return null
    return last.getBoundingClientRect().bottom
  }

  /** Чи клікнув користувач у «порожню» зону (поза блоками контенту). */
  function isEmptyZone(target: EventTarget | null): boolean {
    const pm = editor.value?.view.dom
    if (!pm) return false
    if (!(target instanceof Node)) return true
    // Корінь ProseMirror розтягнуто на всю висоту зони, тому клік нижче
    // останнього блоку влучає саме в нього.
    if (target === pm) return true
    return !pm.contains(target)
  }

  /** Прибирає додані нами порожні абзаци, які так і залишились порожніми. */
  function cleanupAppended() {
    const instance = editor.value
    if (!instance || appendedIds.value.length === 0) return

    const { state, dispatch } = instance.view
    const doc = state.doc
    const tr = state.tr
    const removed: number[] = []

    for (let i = 0; i < doc.childCount; i++) {
      const node = doc.child(i)
      const id = node.attrs?.id as string | undefined
      if (!id || !appendedIds.value.includes(id)) continue
      if (node.type.name !== 'paragraph' || node.content.size !== 0) continue
      removed.push(i)
    }

    if (removed.length === 0) {
      appendedIds.value = []
      return
    }

    // Видаляємо з кінця, щоб позиції попередніх блоків не зміщувалися.
    for (let k = removed.length - 1; k >= 0; k--) {
      const index = removed[k]!
      const from = childPos(doc, index)
      tr.delete(from, from + doc.child(index).nodeSize)
    }

    const removedIds = new Set(
      removed.map((index) => doc.child(index).attrs?.id as string | undefined),
    )
    appendedIds.value = appendedIds.value.filter((id) => !removedIds.has(id))
    dispatch(tr)
  }

  function handleMouseDown(event: MouseEvent) {
    const instance = editor.value
    if (!instance) return
    if (event.button !== 0) return
    if (!isEmptyZone(event.target)) return

    const bottom = lastBlockBottom()
    if (bottom === null) return

    // Скільки рядків нижче останнього блоку було натиснуто.
    const step = lineBoxHeight()
    const extra = Math.max(1, Math.round((event.clientY - bottom) / step))

    // Зупиняємо штатну обробку ProseMirror — інакше він сам поставить
    // каретку в кінець останнього блоку.
    event.preventDefault()
    event.stopPropagation()

    const { state, dispatch } = instance.view
    const paragraph = state.schema.nodes.paragraph
    if (!paragraph) return

    // 1. Додаємо порожні абзаци, щоб під зоною кліку з'явилося місце.
    const tr = state.tr
    let insertPos = state.doc.content.size
    for (let i = 0; i < extra; i++) {
      const node = paragraph.create()
      tr.insert(insertPos, node)
      insertPos += node.nodeSize
    }
    dispatch(tr.scrollIntoView())

    // 2. запам'ятовуємо id доданих абзаців (UniqueID проставляє їх
    //    у appendTransaction, тобто вже після dispatch).
    const addedDoc = instance.state.doc
    const addedIds: string[] = []
    for (let i = Math.max(0, addedDoc.childCount - extra); i < addedDoc.childCount; i++) {
      const id = addedDoc.child(i).attrs?.id as string | undefined
      if (id) addedIds.push(id)
    }

    // 3. Уточнюємо цільовий блок за координатами кліку: ProseMirror тепер
    //    «бачить» абзаци під курсором і повертає точний блок.
    const coords = instance.view.posAtCoords({ left: event.clientX, top: event.clientY })
    let targetIndex = instance.state.doc.childCount - 1
    if (coords && typeof coords.pos === 'number') {
      const index = childIndexAt(instance.state.doc, coords.pos)
      if (index >= instance.state.doc.childCount - extra) targetIndex = index
    }

    // 4. Прибираємо зайві абзаци, додані нижче цільового.
    const doc = instance.state.doc
    const total = doc.childCount
    if (targetIndex < total - 1) {
      const tr2 = instance.state.tr
      for (let i = total - 1; i > targetIndex; i--) {
        const from = childPos(doc, i)
        tr2.delete(from, from + doc.child(i).nodeSize)
      }
      dispatch(tr2)
    }

    // 5. Ставимо каретку в цільовий абзац.
    const finalDoc = instance.state.doc
    const pos = childPos(finalDoc, targetIndex) + 1
    const tr3 = instance.state.tr
    tr3.setSelection(TextSelection.near(finalDoc.resolve(pos), 1))
    dispatch(tr3.scrollIntoView())
    instance.view.focus()

    // 6. Запам'ятовуємо лише ті абзаци, які залишились на місці.
    const keptIds: string[] = []
    const keptDoc = instance.state.doc
    for (let i = targetIndex; i < keptDoc.childCount; i++) {
      const id = keptDoc.child(i).attrs?.id as string | undefined
      if (id && addedIds.includes(id)) keptIds.push(id)
    }
    appendedIds.value = [...appendedIds.value, ...keptIds]
  }

  function handleBlur() {
    cleanupAppended()
  }

  editor.value?.on('blur', handleBlur)

  onBeforeUnmount(() => {
    editor.value?.off('blur', handleBlur)
  })

  return { handleMouseDown, appendedIds }
}
