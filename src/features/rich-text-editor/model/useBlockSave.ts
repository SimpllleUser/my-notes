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

/**
 * Debounced блочне збереження Tiptap-редактора.
 * Порівнює попередній і поточний JSON документа, обчислює диференцію
 * (create / update / delete) по top-level блоках і викликає `onSave`.
 *
 * @param editor - Tiptap editor ref
 * @param onSave - 콜бек із змінами блоків (тут фактичний API-запит)
 * @param options.debounceMs - затримка перед надсиланням (мс), за замовчуванням 300
 */
export function useBlockSave(
  editor: EditorRef,
  onSave: (changes: BlockChange[]) => Promise<void>,
  options: { debounceMs?: number } = {}
) {
  const debounceMs = options.debounceMs ?? 300
  const previousContent = ref<JSONContent | null>(null)
  const isSaving = ref(false)
  const lastError = ref<Error | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null

  function flush() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function save() {
    flush()
    timer = setTimeout(() => {
      timer = null
      void performSave()
    }, debounceMs)
  }

  async function performSave() {
    const current = editor.value?.getJSON()
    const prev = previousContent.value

    if (!current || JSON.stringify(current) === JSON.stringify(prev)) return

    const changes = diffBlocks(prev?.content ?? [], current.content)
    previousContent.value = current

    if (changes.length === 0) return

    isSaving.value = true
    lastError.value = null

    try {
      await onSave(changes)
      // Приклад:
      // await fetch('/api/blocks', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ changes }),
      // })
      //console.log('Block changes to save:', changes)
    } catch (err) {
      lastError.value = err instanceof Error ? err : new Error(String(err))
    } finally {
      isSaving.value = false
    }
  }

  function init() {
    previousContent.value = editor.value?.getJSON() ?? null
  }

  function getNodeId(node: JSONContent): string | undefined {
    return (node.attrs as Record<string, unknown> | undefined)?.id as string | undefined
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
    isSaving,
    lastError,
    init,
    flush,
  }
}
