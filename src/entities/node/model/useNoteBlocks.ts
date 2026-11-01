import { onScopeDispose, ref, shallowRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { OutputBlockData, OutputData } from '@bloklabs/core'
import { unwrap } from '@/shared/api/unwrap.ts'
import { nodeAPI } from './api'
import { diffBlocks, type BlockChange, type BlockEntry } from './diffBlocks'
import { assignOrders } from './order'
import { blockToPayload, rowsToBlocks } from './serialization'
import type { SyncStatus } from './syncStatus'

const DEBOUNCE_MS = 600
const RETRY_DELAY_MS = 2000
const MAX_RETRIES = 3
const BATCH_SIZE = 5

/** Незавершені збереження закритих сесій: повторне відкриття нотатки чекає на них. */
const closingSessions = new Map<string, Promise<void>>()

/** Редактор не вміє рендерити порожній масив блоків, тому завжди віддаємо хоча б один абзац. */
const toOutputData = (blocks: OutputBlockData[]): OutputData => ({
  blocks: blocks.length
    ? blocks
    : [{ id: crypto.randomUUID(), type: 'paragraph', data: { text: '' } }],
})

/**
 * Сесія роботи з блоками ОДНІЄЇ нотатки: завантаження + збереження змін.
 * `noteId` фіксується при створенні, тому зміни ніколи не потраплять в іншу нотатку.
 * Викликати в setup компонента, який має `:key="noteId"`.
 */
export function useNoteBlocks(noteId: string) {
  const content = shallowRef<OutputData | null>(null)
  const isLoading = ref(true)
  const loadError = ref<unknown>(null)
  const status = ref<SyncStatus>('saved')

  /** Що вже гарантовано збережено на сервері (blockId → блок + order / rowId). */
  const committed = new Map<string, BlockEntry>()
  const rowIds = new Map<string, string>()

  let latest: OutputBlockData[] | null = null
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
      for (const { rowId, block, order } of loaded) {
        committed.set(block.id!, { block, order })
        rowIds.set(block.id!, rowId)
      }

      content.value = toOutputData(loaded.map(({ block }) => block))
    } catch (error) {
      loadError.value = error
    } finally {
      isLoading.value = false
    }
  }

  // ——— Запис: окремі операції ———
  async function createRow(entry: BlockEntry) {
    const row = await unwrap(nodeAPI.create(blockToPayload(entry, noteId)))
    rowIds.set(entry.block.id!, row.$id)
    committed.set(entry.block.id!, entry)
  }

  async function updateRow(entry: BlockEntry) {
    const id = entry.block.id!
    const rowId = rowIds.get(id)
    if (!rowId) return createRow(entry)

    await unwrap(nodeAPI.update(rowId, blockToPayload(entry, noteId)))
    committed.set(id, entry)
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
        return createRow(change.entry)
      case 'update':
        return updateRow(change.entry)
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

  /** Блоки з id + дробовий order: незмінені блоки зберігають свій order, переміщені отримують новий. */
  function toEntries(blocks: OutputBlockData[]): BlockEntry[] {
    const identified = blocks.filter((block) => Boolean(block.id))
    const savedOrders = new Map([...committed].map(([id, entry]) => [id, entry.order]))
    const orders = assignOrders(identified as { id: string }[], savedOrders)
    return identified.map((block) => ({ block, order: orders.get(block.id!)! }))
  }

  // ——— Запис: черга ———
  async function persist() {
    if (!latest) return
    const target = latest
    latest = null

    const failed = await applyAll(diffBlocks(committed, toEntries(target)))

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
  function schedule(data: OutputData) {
    latest = data.blocks
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
