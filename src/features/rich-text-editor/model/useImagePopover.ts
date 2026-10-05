import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { EditorRef } from './types'

const DEFAULT_ALT = 'Зображення'

export function useImagePopover(editor: EditorRef, beforeOpen: () => void) {
  const isOpen = ref(false)
  const url = ref('')
  const alt = ref('')
  const urlInput = ref<HTMLInputElement | null>(null)
  const root = ref<HTMLElement | null>(null)

  function open() {
    beforeOpen()
    url.value = ''
    alt.value = ''
    isOpen.value = true
    nextTick(() => urlInput.value?.focus())
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    if (isOpen.value) close()
    else open()
  }

  function confirm() {
    const src = url.value.trim()
    if (!src || !editor.value) return
    editor.value
      .chain()
      .focus()
      .setImage({ src, alt: alt.value.trim() || DEFAULT_ALT })
      .run()
    close()
  }

  function closeOnClickOutside(event: MouseEvent) {
    if (root.value && !root.value.contains(event.target as globalThis.Node)) close()
  }

  watch(isOpen, (opened) => {
    if (opened) document.addEventListener('mousedown', closeOnClickOutside)
    else document.removeEventListener('mousedown', closeOnClickOutside)
  })
  onBeforeUnmount(() => document.removeEventListener('mousedown', closeOnClickOutside))

  return { isOpen, url, alt, urlInput, root, open, close, toggle, confirm }
}
