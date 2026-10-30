import { ref, watch, type Ref } from 'vue'
import type { JSONContent } from '@tiptap/vue-3'
import { useNodesStore } from '@/entities/node/model/store.ts'
import { deserialize } from '@/entities/node/model/helpers.ts'
import type { Node } from '@/entities/node'

/**
 * Готує вміст редактора (Tiptap JSONContent) для нотатки за її ID.
 * Інкапсулює fetch нод з Appwrite, десеріалізацію та сортування за `order`.
 */
export function useNodeBlocks(noteId: Ref<string | null>) {
  const content = ref<JSONContent>({ type: 'doc', content: [] })
  const contentNoteId = ref<string | null>(null)
  const isLoading = ref(false)

  watch(
    noteId,
    async (id) => {
      if (!id) {
        content.value = { type: 'doc', content: [] }
        contentNoteId.value = null
        return
      }

      isLoading.value = true
      contentNoteId.value = null

      const nodeStore = useNodesStore()
      const data = await nodeStore.getAll(id)

      // Ігноруємо застарілу відповідь, якщо міжчасно змінився noteId
      if (noteId.value !== id) return

      const blocks = (data ?? [])
        .map((node: Node) => deserialize(node))
        .sort((left, right) => {
          const leftOrder = Number(left?.attrs?.order ?? 0)
          const rightOrder = Number(right?.attrs?.order ?? 0)
          return leftOrder - rightOrder
        })

      content.value = { type: 'doc', content: blocks }
      contentNoteId.value = id
      isLoading.value = false
    },
  )

  return { content, contentNoteId, isLoading }
}
