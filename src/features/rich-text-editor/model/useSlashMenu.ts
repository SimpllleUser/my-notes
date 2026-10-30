import { computed, ref, watch } from 'vue'
import type { SlashCommand } from './slashCommands'
import type { EditorRef } from './types'

const SLASH_LINE = /^\/([^\s]*)$/
const LOOKBEHIND_CHARS = 80

/** Slash-меню: відстежує `/запит` на початку рядка та навігацію по командах. */
export function useSlashMenu(editor: EditorRef, getCommands: () => SlashCommand[]) {
  const query = ref('')
  const range = ref<{ from: number; to: number } | null>(null)
  const activeIndex = ref(0)
  const manualAnchor = ref<number | null>(null)

  const isOpen = computed(() => range.value !== null)
  const visibleCommands = computed(() => {
    const needle = query.value.toLocaleLowerCase()
    return getCommands().filter((command) =>
      `${command.name} ${command.description} ${command.keywords}`
        .toLocaleLowerCase()
        .includes(needle),
    )
  })
  const isShown = computed(() => isOpen.value && visibleCommands.value.length > 0)

  watch(query, () => (activeIndex.value = 0))

  function close() {
    range.value = null
    query.value = ''
    activeIndex.value = 0
    manualAnchor.value = null
  }

  /**
   * Відкриває меню без текстового тригера — як кнопка «+» у Notion.
   * Закривається при будь-якій зміні позиції каретки (введення тексту, клік).
   */
  function openManual() {
    const instance = editor.value
    if (!instance) return
    manualAnchor.value = instance.state.selection.from
    range.value = { from: manualAnchor.value, to: manualAnchor.value }
    query.value = ''
    activeIndex.value = 0
  }

  function syncWithSelection() {
    const instance = editor.value
    if (!instance) return
    const { from } = instance.state.selection
    if (manualAnchor.value !== null) {
      if (from !== manualAnchor.value) close()
      return
    }
    const textBefore = instance.state.doc.textBetween(
      Math.max(0, from - LOOKBEHIND_CHARS),
      from,
      '\n',
      '￼',
    )
    const line = textBefore.split('\n').at(-1) ?? ''
    const match = line.match(SLASH_LINE)
    if (!match) return close()
    query.value = match[1] ?? ''
    range.value = { from: from - line.length, to: from }
  }

  function select(command: SlashCommand) {
    if (!editor.value || !range.value) return
    editor.value.chain().focus().deleteRange(range.value).run()
    close()
    command.run()
  }

  function moveSelection(direction: 1 | -1) {
    const count = visibleCommands.value.length
    activeIndex.value = (activeIndex.value + direction + count) % count
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen.value) return
    if (event.key === 'Escape') {
      event.preventDefault()
      return close()
    }
    if (!visibleCommands.value.length) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveSelection(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      select(visibleCommands.value[activeIndex.value] ?? visibleCommands.value[0]!)
    }
  }

  return {
    activeIndex,
    visibleCommands,
    isShown,
    close,
    openManual,
    syncWithSelection,
    select,
    handleKeydown,
  }
}
