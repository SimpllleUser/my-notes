/** Група редактора (як editor group у VS Code): власний набір вкладок і одна активна. */
export interface EditorGroup {
  id: string
  /** id нотаток у порядку відображення */
  tabs: string[]
  activeTab: string | null
}

export interface WorkbenchState {
  groups: EditorGroup[]
  activeGroupId: string
}
