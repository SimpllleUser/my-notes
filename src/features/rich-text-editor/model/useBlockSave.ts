import { ref } from 'vue'
import type { EditorRef } from './types'
import type { JSONContent } from '@tiptap/vue-3'

export enum BlockAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export interface BlockChange {
  id: string
  action: BlockAction
  type?: string
  attrs?: Record<string, unknown>
  content?: unknown[]
  order?: number
}

export interface UseBlockSaveOptions {
  debounceMs?: number
  maxRetries?: number
}

/**
 * Надійне дебаунс-zбереження Tiptap-редактора.
 * Порівнює попередній і поточний JSON документа, обчислює диференцію
 * (create / update / delete) по top-level блоках і викликає `onSave`.
 *
 * Надійність:
 *   - `previousContent` оновлюється ТІЛЬКІ після успішної відповіді сервера.
 *     Якщо запит впав, база не зсувається — наступна спроба обчислює диференцію
 *     ще раз і надсилає оновлений вміст (змени не втрачаються).
 *   - Автоповтор (retry) з лінійною відstawкою при помилках мережі.
 *   - `flush()` — негайна відправка накопичених змін без очікування дебаунсу
 *     (викликати перед закриттям вкладки або переходом між сторінками).
 *   - `destroy()` — прибирання таймера та остаточна відправка при розmontуванні.
 *
 * @param editor - Tiptap editor ref
 * @param onSave - колбек із змінами блоків (фактичний API-запит)
 * @param options.debounceMs - затримка перед надсиланням (мс), за замовчуванням 500
 * @param options.maxRetries - кількість повторних спроб при помилці, за замовчуванням 3
 * @param options - додаткові опції
 */
export function useBlockSave(
  editor: EditorRef,
  onSave: (changes: BlockChange[]) => Promise<void>,
  options: UseBlockSaveOptions = {}
) {
  const debounceMs = options.debounceMs ?? 500
  const maxRetries = options.maxRetries ?? 3

  const previousContent = ref<JSONContent | null>(null)
  const isSaving = ref(false)
  const lastError = ref<Error | null>(null)
  const retryCount = ref(0)

  let timer: ReturnType<typeof setTimeout> | null = null
  let destroyed = false

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  /**
   * Надсилати накопичені зміни негайно, не чекаючи дебаунсу.
   * Викликати перед закриттям сторінки або переходом між сторінками.
   */
  async function flush() {
    clearTimer()
    await performSave()
  }

  function save() {
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      void performSave()
    }, debounceMs)
  }

  async function performSave() {
    if (destroyed) return

    const current = editor.value?.getJSON()
    const prev = previousContent.value

    if (!current || JSON.stringify(current) === JSON.stringify(prev)) return

    const changes = diffBlocks(prev?.content ?? [], current.content)
    if (changes.length === 0) return

    isSaving.value = true
    lastError.value = null

    try {
      await onSave(changes)
      // Фіксуємо новий базовий стан лише після успішної відповіді сервера.
      // При помилці previousContent не змінюється, тому зміни повторюються
      // з оновленим вмістом при наступній спробі.
      previousContent.value = current
      retryCount.value = 0
    } catch (err) {
      lastError.value = err instanceof Error ? err : new Error(String(err))

      if (retryCount.value < maxRetries) {
        retryCount.value += 1
        const backoffMs = debounceMs * retryCount.value
        timer = setTimeout(() => {
          timer = null
          void performSave()
        }, backoffMs)
      } else {
        retryCount.value = 0
      }
    } finally {
      // Якщо запланований повтор, isSaving залишаємо true до останньої спроби
      if (!timer) isSaving.value = false
    }
  }

  /**
   * Прибирання ресурсів при розmontуванні компонента: скасовуємо таймер і
   * надсилаємо остаточні зміни, щоб нічого не втратити при переході.
   */
  async function destroy() {
    destroyed = true
    clearTimer()
    await performSave()
  }

  function init() {
    previousContent.value = editor.value?.getJSON() ?? null
    retryCount.value = 0
    lastError.value = null
  }

  function getNodeId(node: JSONContent): string | undefined {
    const attrs = node.attrs as Record<string, unknown> | undefined
    // `nodeId` — атрибут розширення BlockOrder (Appwrite row ID блоку),
    // `id` — авто-ID від UniqueID. Спробуємо обидва.
    return (attrs?.nodeId ?? attrs?.id) as string | undefined
  }

  function diffBlocks(prev: JSONContent[], curr: JSONContent[]): BlockChange[] {
    const changes: BlockChange[] = []
    const prevById = new Map<string, JSONContent>()
    const currById = new Map<string, JSONContent>()

    prev.forEach((b) => {
      const id = getNodeId(b)
      if (id) prevById.set(id, b)
    })

    curr.forEach((b, index) => {
      const id = getNodeId(b)
      const key = id || `__idx_${index}`
      currById.set(key, b)
    })

    // Видалені блоки
    for (const [id, node] of prevById) {
      if (!currById.has(id)) {
        changes.push({
          id,
          action: BlockAction.Delete,
          type: node.type,
          attrs: node.attrs as Record<string, unknown>,
          content: node.content,
        })
      }
    }

    // Створені або оновлені блоки
    curr.forEach((node, index) => {
      const id = getNodeId(node) || `__idx_${index}`
      const prevNode = prevById.get(id)
      const order = ((node.attrs as Record<string, unknown> | undefined)?.order as number) ?? index

      if (!prevNode) {
        changes.push({
          id,
          action: BlockAction.Create,
          type: node.type,
          attrs: node.attrs as Record<string, unknown>,
          content: node.content,
          order,
        })
      } else if (
        JSON.stringify(prevNode) !== JSON.stringify(node) ||
        ((prevNode.attrs as Record<string, unknown>)?.order) !==
          ((node.attrs as Record<string, unknown>)?.order)
      ) {
        changes.push({
          id,
          action: BlockAction.Update,
          type: node.type,
          attrs: node.attrs as Record<string, unknown>,
          content: node.content,
          order,
        })
      }
    })

    return changes
  }

  return {
    save,
    flush,
    isSaving,
    lastError,
    init,
    destroy,
  }
}
