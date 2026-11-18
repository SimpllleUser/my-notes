import type { EditorGroup, WorkbenchState } from './types'

/**
 * Чисті функції над станом workbench. Кожна повертає новий стан і нічого не мутує.
 * Інваріант: нотатка відкрита максимум в одній групі (тому два редактори
 * ніколи не пишуть в одну нотатку одночасно).
 */

const createGroup = (tabs: string[] = []): EditorGroup => ({
  id: crypto.randomUUID(),
  tabs,
  activeTab: tabs[0] ?? null,
})

export function createInitialState(): WorkbenchState {
  const group = createGroup()
  return { groups: [group], activeGroupId: group.id }
}

const findGroup = (state: WorkbenchState, groupId: string) =>
  state.groups.find((group) => group.id === groupId)

const findGroupByTab = (state: WorkbenchState, noteId: string) =>
  state.groups.find((group) => group.tabs.includes(noteId))

const replaceGroup = (state: WorkbenchState, updated: EditorGroup): WorkbenchState => ({
  ...state,
  groups: state.groups.map((group) => (group.id === updated.id ? updated : group)),
})

/** Прибирає вкладку; якщо вона була активною — активною стає сусідня. */
function withoutTab(group: EditorGroup, noteId: string): EditorGroup {
  const index = group.tabs.indexOf(noteId)
  if (index === -1) return group

  const tabs = group.tabs.filter((tab) => tab !== noteId)
  const activeTab =
    group.activeTab === noteId ? (tabs[index] ?? tabs[index - 1] ?? null) : group.activeTab
  return { ...group, tabs, activeTab }
}

/** Порожня група зникає, окрім останньої: вона лишається як порожній workbench. */
function dropIfEmpty(state: WorkbenchState, groupId: string): WorkbenchState {
  const index = state.groups.findIndex((group) => group.id === groupId)
  const group = state.groups[index]
  if (!group || group.tabs.length > 0 || state.groups.length === 1) return state

  const groups = state.groups.filter((item) => item.id !== groupId)
  const activeGroupId =
    state.activeGroupId === groupId
      ? (groups[index] ?? groups[index - 1]).id
      : state.activeGroupId
  return { groups, activeGroupId }
}

export function focusGroup(state: WorkbenchState, groupId: string): WorkbenchState {
  return findGroup(state, groupId) ? { ...state, activeGroupId: groupId } : state
}

export function activateTab(
  state: WorkbenchState,
  groupId: string,
  noteId: string,
): WorkbenchState {
  const group = findGroup(state, groupId)
  if (!group?.tabs.includes(noteId)) return state
  return { ...replaceGroup(state, { ...group, activeTab: noteId }), activeGroupId: groupId }
}

/** Відкриває нотатку: якщо вже відкрита — фокусує її, інакше додає праворуч від активної вкладки. */
export function openTab(state: WorkbenchState, noteId: string): WorkbenchState {
  const owner = findGroupByTab(state, noteId)
  if (owner) return activateTab(state, owner.id, noteId)

  const target = findGroup(state, state.activeGroupId) ?? state.groups[0]
  const insertAt = target.activeTab ? target.tabs.indexOf(target.activeTab) + 1 : target.tabs.length
  const tabs = [...target.tabs.slice(0, insertAt), noteId, ...target.tabs.slice(insertAt)]
  return {
    ...replaceGroup(state, { ...target, tabs, activeTab: noteId }),
    activeGroupId: target.id,
  }
}

export function closeTab(state: WorkbenchState, groupId: string, noteId: string): WorkbenchState {
  const group = findGroup(state, groupId)
  if (!group) return state
  return dropIfEmpty(replaceGroup(state, withoutTab(group, noteId)), groupId)
}

/** Переносить вкладку в нову групу праворуч. Для групи з однією вкладкою нічого не робить. */
export function splitRight(state: WorkbenchState, groupId: string, noteId: string): WorkbenchState {
  const source = findGroup(state, groupId)
  if (!source?.tabs.includes(noteId) || source.tabs.length < 2) return state

  const created = createGroup([noteId])
  const groups = state.groups.map((group) =>
    group.id === groupId ? withoutTab(group, noteId) : group,
  )
  groups.splice(state.groups.indexOf(source) + 1, 0, created)
  return { groups, activeGroupId: created.id }
}

/** Переносить вкладку в іншу існуючу групу (drag & drop). */
export function moveTab(state: WorkbenchState, noteId: string, toGroupId: string): WorkbenchState {
  const source = findGroupByTab(state, noteId)
  const target = findGroup(state, toGroupId)
  if (!source || !target || source.id === target.id) return state

  const moved = replaceGroup(
    replaceGroup(state, withoutTab(source, noteId)),
    { ...target, tabs: [...target.tabs, noteId], activeTab: noteId },
  )
  return dropIfEmpty({ ...moved, activeGroupId: target.id }, source.id)
}

/** Закриває вкладки нотаток, яких більше не існує (наприклад, після видалення). */
export function retainTabs(state: WorkbenchState, existing: ReadonlySet<string>): WorkbenchState {
  return state.groups
    .flatMap((group) => group.tabs)
    .filter((noteId) => !existing.has(noteId))
    .reduce((next, noteId) => {
      const owner = findGroupByTab(next, noteId)
      return owner ? closeTab(next, owner.id, noteId) : next
    }, state)
}

const isGroup = (value: unknown): value is EditorGroup => {
  const group = value as EditorGroup
  return (
    typeof group?.id === 'string' &&
    Array.isArray(group.tabs) &&
    group.tabs.every((tab) => typeof tab === 'string') &&
    (group.activeTab === null || group.tabs.includes(group.activeTab))
  )
}

/** Розбирає збережений стан; при пошкоджених даних повертає порожній workbench. */
export function parseState(raw: string | null): WorkbenchState {
  try {
    const parsed = JSON.parse(raw ?? 'null') as WorkbenchState | null
    const valid =
      Array.isArray(parsed?.groups) &&
      parsed.groups.length > 0 &&
      parsed.groups.every(isGroup) &&
      parsed.groups.some((group) => group.id === parsed.activeGroupId)
    return valid ? parsed : createInitialState()
  } catch {
    return createInitialState()
  }
}
