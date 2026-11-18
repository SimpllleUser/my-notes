import { ref } from 'vue'
import { appendImportedBlocks, parseImportedBlocks, reloadNote } from '@/entities/node'

export function useAppendImport(getNoteId: () => string) {
  const isOpen = ref(false)
  const isImporting = ref(false)
  const error = ref('')

  function open() {
    error.value = ''
    isOpen.value = true
  }

  async function importInto(json: string) {
    if (isImporting.value) return
    isImporting.value = true
    error.value = ''

    try {
      const noteId = getNoteId()
      await appendImportedBlocks(noteId, parseImportedBlocks(json))
      reloadNote(noteId)
      isOpen.value = false
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не вдалося виконати імпорт.'
    } finally {
      isImporting.value = false
    }
  }

  return { isOpen, isImporting, error, open, importInto }
}
