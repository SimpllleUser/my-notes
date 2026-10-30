import { onScopeDispose, ref, shallowRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { JSONContent } from '@tiptap/vue-3'
import { unwrap } from '@/shared/api/unwrap.ts'
import { nodeAPI } from './api'
import { getBlockId } from './blocks'
import { diffBlocks, type BlockChange } from './diffBlocks'
import { blockToPayload, rowsToBlocks } from './serialization'
import type { SyncStatus } from './syncStatus'

const DEBOUNCE_MS = 600
const RETRY_DELAY_MS = 2000
const MAX_RETRIES = 3
const BATCH_SIZE = 5

/** Незавершені збереження закритих сесій: повторне відкриття нотатки чекає на них. */
const closingSessions = new Map<string, Promise<void>>()

/**
 * Сесія роботи з блоками ОДНІЄЇ нотатки: завантаження + збереження змін.
 * `noteId` фіксується при створенні, тому зміни ніколи не потраплять в іншу нотатку.
 * Викликати в setup компонента, який має `:key="noteId"`.
 */
export function useNoteBlocks(noteId: string) {
  const content = shallowRef<JSONContent | null>(null)
  const isLoading = ref(true)
  const loadError = ref<unknown>(null)
  const status = ref<SyncStatus>('saved')

  /** Що вже гарантовано збережено на сервері (blockId → block / rowId). */
  const committed = new Map<string, JSONContent>()
  const rowIds = new Map<string, string>()

  let latest: JSONContent[] | null = null
  let queue: Promise<void> = Promise.resolve()
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retries = 0

  // ——— Читання ———
  async function load() {
    isLoading.value = true
    loadError.value = null
    try {
      await closingSessions.get(noteId)
      const loaded = rowsToBlocks(await unwrap(nodeAPI.getAll(noteId)))

      committed.clear()
      rowIds.clear()
      for (const { rowId, block } of loaded) {
        const id = getBlockId(block)!
        committed.set(id, block)
        rowIds.set(id, rowId)
      }

      content.value = {
        type: 'doc',
        content: loaded.length ? loaded.map(({ block }) => block) : [{ type: 'paragraph' }],
      }
    } catch (error) {
      loadError.value = error
    } finally {
      isLoading.value = false
    }
  }

  // ——— Запис: окремі операції ———
  async function createRow(block: JSONContent) {
    const row = await unwrap(nodeAPI.create(blockToPayload(block, noteId)))
    const id = getBlockId(block)!
    rowIds.set(id, row.$id)
    committed.set(id, block)
  }

  async function updateRow(block: JSONContent) {
    const id = getBlockId(block)!
    const rowId = rowIds.get(id)
    if (!rowId) return createRow(block)

    await unwrap(nodeAPI.update(rowId, blockToPayload(block, noteId)))
    committed.set(id, block)
  }

  async function deleteRow(blockId: string) {
    const rowId = rowIds.get(blockId)
    if (rowId) await unwrap(nodeAPI.delete(rowId))
    rowIds.delete(blockId)
    committed.delete(blockId)
  }

  function applyChange(change: BlockChange) {
    switch (change.action) {
      case 'create':
        return createRow(change.block)
      case 'update':
        return updateRow(change.block)
      case 'delete':
        return deleteRow(change.blockId)
    }
  }

  /** Кожна успішна операція одразу оновлює baseline, тож ретрай не створює дублікатів. */
  async function applyAll(changes: BlockChange[]) {
    let failed = 0
    for (let i = 0; i < changes.length; i += BATCH_SIZE) {
      const batch = changes.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(batch.map(applyChange))
      failed += results.filter((result) => result.status === 'rejected').length
    }
    return failed
  }

  // ——— Запис: черга ———
  async function persist() {
    if (!latest) return
    const target = latest
    latest = null

    const failed = await applyAll(diffBlocks(committed, target))

    if (failed === 0) {
      retries = 0
      if (!latest) status.value = 'saved'
      return
    }

    latest ??= target
    status.value = 'error'
    if (retries < MAX_RETRIES) {
      retries += 1
      retryTimer = setTimeout(flush, RETRY_DELAY_MS * retries)
    }
  }

  /** Негайно зберегти все накопичене (флаші виконуються строго по черзі). */
  function flush(): Promise<void> {
    clearTimeout(debounceTimer)
    clearTimeout(retryTimer)
    queue = queue.then(persist)
    return queue
  }

  /** Викликається редактором на кожну зміну; сам збереже після паузи. */
  function schedule(doc: JSONContent) {
    latest = doc.content ?? []
    retries = 0
    status.value = 'saving'
    clearTimeout(debounceTimer)
    clearTimeout(retryTimer)
    debounceTimer = setTimeout(flush, DEBOUNCE_MS)
  }

  // ——— Життєвий цикл ———
  useEventListener(window, 'pagehide', () => void flush())
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush()
  })

  onScopeDispose(() => {
    const pending: Promise<void> = flush().finally(() => {
      if (closingSessions.get(noteId) === pending) closingSessions.delete(noteId)
    })
    closingSessions.set(noteId, pending)
  })

  void load()

  return { content, isLoading, loadError, status, schedule, flush, reload: load }
}
