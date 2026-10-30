import { ref } from 'vue'
import { BlockAction, type BlockChange } from '@/features/rich-text-editor/model/useBlockSave.ts'
import { useNodesStore } from '@/entities/node/model/store.ts'
import { serialize } from '@/entities/node/model/helpers.ts'

/**
 * Бізнес-логіка синхронізації блоків нотатки з сервером (node-синк).
 * Інкапсулює чергу запитів create/update/delete блоку та стан збереження.
 *
 * Використовується сторінками (folder page) для блочного синку редактора.
 * Не залежить від Vue-компонентів — можна тестувати окремо.
 *
 * @param onChange - опціональний колбек після успішного застосування змін
 */
export function useNodeSync(onChange?: () => void) {
  const nodeStore = useNodesStore()

  // ——— Стан ———
  const isSaving = ref(false)
  const lastError = ref<Error | null>(null)

  // Черга запитів, щоб збереження не накладалися один на один
  let saveFinished = Promise.resolve()

  // ——— Методи ———
  /**
   * Застосовує блокові зміни (create/update/delete) послідовно через node API.
   *
   * @param noteId - ID нотатки, до якої належать блоки
   * @param changes - блокові зміни з редактора
   */
  async function applyChanges(noteId: string, changes: BlockChange[]) {
    if (!noteId) return

    isSaving.value = true
    lastError.value = null

    const commit = async () => {
      await Promise.all(
        changes.map(async (change) => {
          const rowId = change.attrs?.nodeId as string | undefined
          let result: { data: unknown; error: unknown }

          switch (change.action) {
            case BlockAction.Create:
              result = await nodeStore.create(serialize(change, noteId))
              break
            case BlockAction.Update:
              if (typeof rowId === 'string') {
                result = await nodeStore.update(rowId, serialize(change, noteId))
                break
              }
              return
            case BlockAction.Delete:
              if (typeof rowId === 'string') {
                result = await nodeStore.delete(rowId)
                break
              }
              return
            default:
              return
          }

          // nodeAPI.* не кидає помилки — повертає їх у `error`, тому перевіряємо вручну
          if (result.error) throw result.error
        }),
      )
    }

    saveFinished = saveFinished.then(commit).catch((err) => {
      lastError.value = err instanceof Error ? err : new Error(String(err))
    })

    try {
      await saveFinished
    } finally {
      isSaving.value = false
      onChange?.()
    }

    if (lastError.value) throw lastError.value
  }

  /**
   * Надсилати всі накопичені зміни негайно.
   */
  async function flushPending() {
    await saveFinished
  }

  return {
    isSaving,
    lastError,
    applyChanges,
    flushPending,
  }
}
