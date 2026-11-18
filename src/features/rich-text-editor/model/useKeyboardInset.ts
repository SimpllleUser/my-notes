import { onScopeDispose, ref } from 'vue'
import { useEventListener } from '@vueuse/core'

/**
 * Висота екранної клавіатури, що перекриває сторінку (px).
 * Рахується через visualViewport: на iOS layout viewport не зменшується
 * при відкритті клавіатури, тому `position: fixed; bottom: 0` лишається під нею.
 */
export function useKeyboardInset() {
  const inset = ref(0)
  const viewport = typeof window === 'undefined' ? undefined : window.visualViewport

  function update() {
    if (!viewport) return
    inset.value = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
  }

  if (viewport) {
    useEventListener(viewport, 'resize', update)
    useEventListener(viewport, 'scroll', update)
    update()
  }
  onScopeDispose(() => (inset.value = 0))

  return { inset }
}
