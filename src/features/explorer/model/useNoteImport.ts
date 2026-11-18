import { ref, type ComputedRef, type Ref } from 'vue'
import { parseImportedBlocks, saveImportedBlocks } from '@/entities/node'
import { useNotesStore } from '@/entities/note'

export function useNoteImport(
  folderId: Ref<string>,
  folderIds: ComputedRef<string[]>,
  onNoteImported: (noteId: string) => void,
) {
  const notesStore = useNotesStore()
  const isOpen = ref(false)
  const isImporting = ref(false)
  const error = ref('')

  function open() {
    error.value = ''
    isOpen.value = true
  }

  async function importNote(name: string, json: string) {
    if (isImporting.value) return
    isImporting.value = true
    error.value = ''

    try {
      if (!folderId.value) throw new Error('Спочатку оберіть папку.')
      const blocks = parseImportedBlocks(json)
      const note = await notesStore.create({ name, folder: folderId.value })
      if (!note) throw new Error('Не вдалося створити нотатку.')

      await saveImportedBlocks(note.$id, blocks)
      await Promise.all([notesStore.getAll(folderId.value), notesStore.getByFolder(folderIds.value)])
      onNoteImported(note.$id)
      isOpen.value = false
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не вдалося виконати імпорт.'
    } finally {
      isImporting.value = false
    }
  }

  return { isOpen, isImporting, error, open, importNote }
}
