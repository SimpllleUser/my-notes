import { onBeforeUnmount, ref, watch } from 'vue'
import type { EditorRef } from './types'

export type OverlayPoint = { top: number; left: number }
export type OverlayBox = { top: number; bottom: number; left: number }

/**
 * Позиції плаваючих елементів редактора у viewport-координатах:
 * `caret` — точка під кареткою (slash-меню, поповер зображення),
 * `selection` — рамка виділення (bubble-тулбар форматування).
 * Перераховується при виділенні, змісті, скролі та зміні вікна.
 */
export function useOverlayPosition(editor: EditorRef) {
  const caret = ref<OverlayPoint | null>(null)
  const selection = ref<OverlayBox | null>(null)

  function update() {
    const instance = editor.value
    if (!instance?.view) {
      caret.value = null
      selection.value = null
      return
    }

    const { state, view } = instance
    const { from, to, head, empty } = state.selection

    try {
      const rect = view.coordsAtPos(head)
      caret.value = { top: rect.bottom, left: rect.left }
    } catch {
      caret.value = null
    }

    if (empty) {
      selection.value = null
      return
    }

    try {
      const start = view.coordsAtPos(from)
      const end = view.coordsAtPos(to)
      const sameLine = Math.abs(start.top - end.top) < 2
      const anchorLeft = sameLine ? (start.left + end.left) / 2 : start.left
      selection.value = {
        top: Math.min(start.top, end.top),
        bottom: Math.max(start.bottom, end.bottom),
        left: Math.max(170, Math.min(anchorLeft, window.innerWidth - 170)),
      }
    } catch {
      selection.value = null
    }
  }

  function onViewportChange() {
    if (caret.value || selection.value) update()
  }

  watch(
    editor,
    (instance, previous) => {
      previous?.off('selectionUpdate', update)
      previous?.off('update', update)
      instance?.on('selectionUpdate', update)
      instance?.on('update', update)
      update()
    },
    { immediate: true },
  )

  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)

  onBeforeUnmount(() => {
    editor.value?.off('selectionUpdate', update)
    editor.value?.off('update', update)
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
  })

  return { caret, selection, update }
}
