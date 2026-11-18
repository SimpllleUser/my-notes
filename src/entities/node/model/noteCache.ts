import type { BlockEntry } from './diffBlocks'

/** Серверний стан нотатки, достатній, щоб відкрити її миттєво і далі рахувати diff. */
export interface CachedNote {
  committed: Map<string, BlockEntry>
  rowIds: Map<string, string>
}

const MAX_CACHED_NOTES = 20

/** LRU: Map зберігає порядок вставки, тому найстаріший запис — перший ключ. */
const cache = new Map<string, CachedNote>()

export const noteCache = {
  get(noteId: string): CachedNote | undefined {
    const entry = cache.get(noteId)
    if (!entry) return undefined
    cache.delete(noteId)
    cache.set(noteId, entry)
    return entry
  },

  set(noteId: string, entry: CachedNote) {
    cache.delete(noteId)
    cache.set(noteId, entry)
    if (cache.size > MAX_CACHED_NOTES) cache.delete(cache.keys().next().value!)
  },

  clear() {
    cache.clear()
  },
}
