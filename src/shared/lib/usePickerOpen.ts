import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * Стан відкриття пікера, який може рендеритись у popover або без нього.
 *
 * У inline-режимі (`popover === false`) контент завжди видимий,
 * тому `open` не переходить у `false`, а `show`/`hide`/`toggle` лишаються безпечними.
 */
export function usePickerOpen(popover: MaybeRefOrGetter<boolean>) {
  const isOpen = ref(false)

  const open = computed({
    get: () => isOpen.value || !toValue(popover),
    set: (value: boolean) => {
      isOpen.value = value
    },
  })

  function show() {
    isOpen.value = true
  }

  function hide() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  return { open, show, hide, toggle }
}
