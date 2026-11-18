import { reactive } from 'vue'
import { noteCache } from './noteCache'

const revisions = reactive<Record<string, number>>({})

/** Змінюється після зовнішньої правки нотатки; використовується як частина `key` редактора. */
export const getNoteRevision = (noteId: string) => revisions[noteId] ?? 0

/** Скидає кеш нотатки й змушує відкритий редактор перезавантажитись із сервера. */
export function reloadNote(noteId: string) {
  noteCache.delete(noteId)
  revisions[noteId] = getNoteRevision(noteId) + 1
}
