import { computed, ref } from 'vue'
import type { JSONContent } from '@tiptap/vue-3'
import { useNotesStore } from '@/entities/note/model/store.ts'
import type { Note } from '@/entities/note'
import { StatusTone } from '@/shared/model/enums.ts'

/**
 * Бізнес-логіка синхронізації нотатки з сервером.
 * Інкапсулює чергу запитів, стан збереження, обробку помилок та
 * негайне підсилання залишків змін перед закриттям вкладки / переходом між сторінками.
 *
 * Використовується віджетами (note-editor-panel) та сторінками.
 * Не залежить від Vue-компонентів — можна тестувати окремо.
 *
 * @param note - нотатка для синхронізації (опціональна; якщо немає — демо-режим, збереження на сервер не виконується)
 * @param contentRef - посилання на поточний вміст редактора (JSONContent)
 * @param emit - викликач подій батьківського компонента (onUpdate нотатки після створення)
 */
export function useNoteSync(
  note: Note | undefined,
  contentRef: { value: JSONContent },
  emit?: (event: 'update', value: Note) => void
) {
  const notesStore = useNotesStore()

  // ——— Стан ———
  const isSaving = ref(false)
  const lastError = ref<Error | null>(null)
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Черга запитів, щоб збереження не накладалися один на один
  let saveFinished = Promise.resolve()

  // ——— Computed ———
  const statusLabel = computed(() => {
    switch (saveStatus.value) {
      case 'saving':
        return 'Збереження…'
      case 'saved':
        return 'Збережено'
      case 'error':
        return 'Помилка збереження'
      default:
        return 'Збережено'
    }
  })

  const statusTone = computed(() =>
    saveStatus.value === 'error' ? StatusTone.Muted : StatusTone.Success
  )

  // ——— Методи ———
  /**
   * Запит на збереження поточного вмісту. Записи чергуються послідовно.
   */
  function requestSave() {
    // Демо-режим: якщо нотатку не передано — працюємо тільки як редактор.
    if (!note) return

    isSaving.value = true
    lastError.value = null
    saveStatus.value = 'saving'

    saveFinished = saveFinished
      .then(() => saveNote())
      .catch((err) => {
        lastError.value = err instanceof Error ? err : new Error(String(err))
        saveStatus.value = 'error'
      })
      .finally(() => {
        isSaving.value = false
      })
  }

  async function saveNote() {
    const currentNote = note!
    const payload: Note = {
      ...currentNote,
      content: contentRef.value,
    }

    // Нотатки без $id — нові, створюємо через create, інакше оновлюємо існуючу
    const response =
      currentNote.$id
        ? await notesStore.update(payload)
        : await notesStore.create({
            name: currentNote.name,
            folder: currentNote.folder,
            content: contentRef.value,
          })

    if (response.error) throw response.error
    if (response.data && !currentNote.$id && emit) {
      emit('update', response.data)
    }

    saveStatus.value = 'saved'
  }

  /**
   * Надсилати всі накопичені зміни негайно.
   * Викликати перед закриттям вкладки, перемиканням вкладки у тлі або переходом між сторінками.
   */
  async function flushPending(editorFlush?: () => Promise<void>) {
    await editorFlush?.()
    await saveFinished
  }

  // ——— Життєвий цикл вікна (сторінка/вкладка) ———
  function bindPageVisibilityHandlers() {
    if (typeof window === 'undefined') return

    const handlePageHide = () => void flushPending()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void flushPending()
    }

    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  // ——— Повернене API ———
  return {
    isSaving,
    lastError,
    saveStatus,
    statusLabel,
    statusTone,
    requestSave,
    flushPending,
    bindPageVisibilityHandlers,
  }
}
