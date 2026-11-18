import { onScopeDispose, ref, shallowRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { OutputBlockData, OutputData } from '@bloklabs/core'
import { unwrap } from '@/shared/api/unwrap.ts'
import { nodeAPI } from './api'
import { type BlockChange, type BlockEntry, diffBlocks, isSameEntry } from './diffBlocks'
import { noteCache } from './noteCache'
import { assignOrders } from './order'
import { blockToPayload, type LoadedBlock, rowsToBlocks } from './serialization'
import { SyncStatus } from './syncStatus'
import { ChangeAction, type NodeOperation } from './types'

/** Пауза після останньої правки, через яку зберігаємо. */
const DEBOUNCE_MS = 1000
/** Максимум очікування при безперервному наборі: зберігаємо не рідше. */
const MAX_WAIT_MS = 5000
const RETRY_DELAY_MS = 2000
const MAX_RETRIES = 3
/** Ліміт операцій в одній транзакції Appwrite. */
const MAX_OPERATIONS_PER_COMMIT = 100

/** Незавершені збереження закритих сесій: повторне відкриття нотатки чекає на них. */
const closingSessions = new Map<string, Promise<void>>()

/** Редактор не вміє рендерити порожній масив блоків, тому завжди віддаємо хоча б один абзац. */
const toOutputData = (blocks: OutputBlockData[]): OutputData => ({
  blocks: blocks.length
    ? blocks
    : [{ id: crypto.randomUUID(), type: 'paragraph', data: { text: '' } }],
})

/** Операція разом з тим, що треба зафіксувати в baseline після її успіху. */
interface PlannedOperation {
  operation: NodeOperation
  markCommitted: () => void
}

/**
 * Сесія роботи з блоками ОДНІЄЇ нотатки: завантаження + збереження змін.
 * `noteId` фіксується при створенні, тому зміни ніколи не потраплять в іншу нотатку.
 * Викликати в setup компонента, який має `:key="noteId"`.
 *
 * Завантаження: stale-while-revalidate — якщо нотатку вже відкривали, показуємо кеш
 * одразу, а свіжі дані підтягуємо у фоні. Збереження: debounce + maxWait, пачка
 * змін іде однією транзакцією.
 */
export function useNoteBlocks(noteId: string) {
  const content = shallowRef<OutputData | null>(null)
  const isLoading = ref(true)
  const loadError = ref<unknown>(null)
  const status = ref<SyncStatus>(SyncStatus.Saved)

  /** Що вже гарантовано збережено на сервері (blockId → блок + order / rowId). */
  const committed = new Map<string, BlockEntry>()
  const rowIds = new Map<string, string>()

  let latest: OutputBlockData[] | null = null
  let queue: Promise<void> = Promise.resolve()
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retries = 0
  /** Коли з'явилась перша ще не збережена правка (для maxWait). */
  let pendingSince = 0
  /** Користувач уже щось правив: фонове оновлення з сервера не має перезаписувати редактор. */
  let hasLocalEdits = false

  // ——— Читання ———
  function renderCommitted() {
    const blocks = [...committed.values()]
      .sort((a, b) => a.order - b.order)
      .map(({ block }) => block)
    content.value = toOutputData(blocks)
  }

  function applyLoaded(loaded: LoadedBlock[]) {
    committed.clear()
    rowIds.clear()
    for (const { rowId, block, order } of loaded) {
      committed.set(block.id!, { block, order })
      rowIds.set(block.id!, rowId)
    }
    renderCommitted()
    noteCache.set(noteId, { committed, rowIds })
  }

  const fetchLoaded = async () => rowsToBlocks(await unwrap(nodeAPI.getAll(noteId)))

  function isSameAsCommitted(loaded: LoadedBlock[]) {
    return (
      loaded.length === committed.size &&
      loaded.every(({ block, order, rowId }) => {
        const entry = committed.get(block.id!)
        return entry && rowIds.get(block.id!) === rowId && isSameEntry(entry, { block, order })
      })
    )
  }

  /** Фонове оновлення кешованої нотатки; помилка мережі не заважає працювати з кешем. */
  async function revalidate() {
    try {
      const loaded = await fetchLoaded()
      if (hasLocalEdits || isSameAsCommitted(loaded)) return
      applyLoaded(loaded)
    } catch (error) {
      console.warn('Не вдалося оновити нотатку з сервера', error)
    }
  }

  async function load(useCache = true) {
    isLoading.value = true
    loadError.value = null
    try {
      await closingSessions.get(noteId)

      const cached = useCache ? noteCache.get(noteId) : undefined
      if (cached) {
        committed.clear()
        rowIds.clear()
        cached.committed.forEach((entry, id) => committed.set(id, entry))
        cached.rowIds.forEach((rowId, id) => rowIds.set(id, rowId))
        renderCommitted()
        noteCache.set(noteId, { committed, rowIds })
        void revalidate()
      } else {
        applyLoaded(await fetchLoaded())
      }
    } catch (error) {
      loadError.value = error
    } finally {
      isLoading.value = false
    }
  }

  // ——— Запис: план операцій ———
  function planCreate(entry: BlockEntry): PlannedOperation {
    const id = entry.block.id!
    const rowId = crypto.randomUUID()
    return {
      operation: { action: ChangeAction.Create, rowId, data: blockToPayload(entry, noteId) },
      markCommitted: () => {
        rowIds.set(id, rowId)
        committed.set(id, entry)
      },
    }
  }

  function planUpdate(entry: BlockEntry): PlannedOperation {
    const id = entry.block.id!
    const rowId = rowIds.get(id)
    if (!rowId) return planCreate(entry)
    return {
      operation: { action: ChangeAction.Update, rowId, data: blockToPayload(entry, noteId) },
      markCommitted: () => committed.set(id, entry),
    }
  }

  function planDelete(blockId: string): PlannedOperation | null {
    const rowId = rowIds.get(blockId)
    const forget = () => {
      rowIds.delete(blockId)
      committed.delete(blockId)
    }
    if (!rowId) {
      forget() // на сервері такого рядка немає — достатньо забути локально
      return null
    }
    return { operation: { action: ChangeAction.Delete, rowId }, markCommitted: forget }
  }

  function planChange(change: BlockChange): PlannedOperation | null {
    switch (change.action) {
      case ChangeAction.Create:
        return planCreate(change.entry)
      case ChangeAction.Update:
        return planUpdate(change.entry)
      case ChangeAction.Delete:
        return planDelete(change.blockId)
    }
  }

  /**
   * Кожна пачка комітиться атомарно й оновлює baseline лише після успіху,
   * тож ретрай не створює дублікатів. Повертає кількість операцій, що не пройшли.
   */
  async function applyAll(changes: BlockChange[]) {
    const planned = changes.map(planChange).filter((item) => item !== null)
    let failed = 0

    for (let i = 0; i < planned.length; i += MAX_OPERATIONS_PER_COMMIT) {
      const chunk = planned.slice(i, i + MAX_OPERATIONS_PER_COMMIT)
      const { error } = await nodeAPI.commit(chunk.map(({ operation }) => operation))
      if (error) failed += chunk.length
      else chunk.forEach(({ markCommitted }) => markCommitted())
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
      if (!latest) status.value = SyncStatus.Saved
      return
    }

    latest ??= target
    status.value = SyncStatus.Error
    if (retries < MAX_RETRIES) {
      retries += 1
      retryTimer = setTimeout(flush, RETRY_DELAY_MS * retries)
    }
  }

  /** Негайно зберегти все накопичене (флаші виконуються строго по черзі). */
  function flush(): Promise<void> {
    clearTimeout(debounceTimer)
    clearTimeout(retryTimer)
    pendingSince = 0
    queue = queue.then(persist)
    return queue
  }

  /** Викликається редактором на кожну зміну; зберігає після паузи, але не пізніше за MAX_WAIT_MS. */
  function schedule(data: OutputData) {
    latest = data.blocks
    retries = 0
    hasLocalEdits = true
    status.value = SyncStatus.Saving

    const now = Date.now()
    pendingSince ||= now
    const untilMaxWait = Math.max(0, MAX_WAIT_MS - (now - pendingSince))

    clearTimeout(debounceTimer)
    clearTimeout(retryTimer)
    debounceTimer = setTimeout(flush, Math.min(DEBOUNCE_MS, untilMaxWait))
  }

  // ——— Життєвий цикл ———
  useEventListener(window, 'pagehide', () => void flush())
  useEventListener(window, 'blur', () => void flush())
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

  return { content, isLoading, loadError, status, schedule, flush, reload: () => load(false) }
}
