import { ref, type ComputedRef, type Ref } from 'vue'
import { useFoldersStore } from '@/entities/folder'
import { useNotesStore } from '@/entities/note'
import { FileTreeNodeType, FolderColor } from '@/shared/model/enums.ts'
import type { FileTreeNode } from '@/shared/ui'
import { ExplorerFormMode, FileEntityTypes } from './types'
import type { ExplorerEntity, ExplorerSavePayload } from './types'

export function useExplorerEntityActions(
  folderId: Ref<string>,
  folderIds: ComputedRef<string[]>,
  onNoteSelected: (noteId: string) => void,
  onEntityDeleted: (target: ExplorerEntity) => void,
) {
  const foldersStore = useFoldersStore()
  const notesStore = useNotesStore()
  const isOpen = ref(false)
  const type = ref<FileEntityTypes | null>(null)
  const isSaving = ref(false)
  const error = ref('')
  const mode = ref(ExplorerFormMode.Create)
  const target = ref<ExplorerEntity | null>(null)
  const deleteTargets = ref<ExplorerEntity[]>([])
  const isDeleteOpen = ref(false)
  const isDeleting = ref(false)
  const deleteError = ref('')

  function open(entityType: FileEntityTypes) {
    mode.value = ExplorerFormMode.Create
    target.value = null
    type.value = entityType
    error.value = ''
    isOpen.value = true
  }

  function getEntity(node: FileTreeNode): ExplorerEntity | null {
    if (node.type === FileTreeNodeType.Folder) {
      const entity = foldersStore.getFolder(node.id)
      return entity ? { type: FileEntityTypes.Folder, entity } : null
    }

    for (const id of folderIds.value) {
      const entity = notesStore.getNoteByFolder(id).find((note) => note.$id === node.id)
      if (entity) return { type: FileEntityTypes.File, entity }
    }
    return null
  }

  function openEdit(node: FileTreeNode) {
    const entity = getEntity(node)
    if (!entity) return
    mode.value = ExplorerFormMode.Edit
    target.value = entity
    type.value = entity.type
    error.value = ''
    isOpen.value = true
  }

  function requestDeleteMany(nodes: FileTreeNode[]) {
    const entities = nodes.map(getEntity).filter((entity): entity is ExplorerEntity => entity !== null)
    if (!entities.length) return
    deleteTargets.value = entities
    target.value = entities.length === 1 ? (entities[0] ?? null) : null
    deleteError.value = ''
    isDeleteOpen.value = true
  }

  function getErrorMessage(cause: unknown) {
    return cause instanceof Error ? cause.message : 'Could not complete the action. Please try again.'
  }

  async function save(payload: ExplorerSavePayload) {
    if (!type.value || payload.type !== type.value || isSaving.value) return
    isSaving.value = true
    error.value = ''

    try {
      if (
        mode.value === ExplorerFormMode.Edit &&
        target.value?.type === FileEntityTypes.Folder &&
        payload.type === FileEntityTypes.Folder
      ) {
        const folder = target.value.entity
        await foldersStore.update({ ...folder, name: payload.name, color: payload.color, icon: payload.icon })
        await foldersStore.getAll()
        await notesStore.getByFolder(folderIds.value)
      } else if (
        mode.value === ExplorerFormMode.Edit &&
        target.value?.type === FileEntityTypes.File &&
        payload.type === FileEntityTypes.File
      ) {
        const entity = target.value.entity
        const note = await notesStore.update({ ...entity, name: payload.name })
        await Promise.all([
          notesStore.getAll(entity.folder),
          notesStore.getByFolder(folderIds.value),
        ])
        if (note) onNoteSelected(note.$id)
      } else if (payload.type === FileEntityTypes.Folder) {
        await foldersStore.create({
          name: payload.name,
          color: payload.color || FolderColor.Primary,
          icon: payload.icon || 'Folder',
        })
        await foldersStore.getAll()
        await notesStore.getByFolder(folderIds.value)
      } else {
        if (!folderId.value) throw new Error('Select a folder before creating a note.')
        const note = await notesStore.create({ name: payload.name, folder: folderId.value })
        await Promise.all([
          notesStore.getAll(folderId.value),
          notesStore.getByFolder(folderIds.value),
        ])
        if (note) onNoteSelected(note.$id)
      }

      isOpen.value = false
    } catch (cause) {
      error.value = getErrorMessage(cause)
    } finally {
      isSaving.value = false
    }
  }

  async function remove() {
    const targets = deleteTargets.value.length ? deleteTargets.value : target.value ? [target.value] : []
    if (!targets.length || isDeleting.value) return
    isDeleting.value = true
    deleteError.value = ''

    try {
      const folderTargets = targets.filter((item) => item.type === FileEntityTypes.Folder)
      const noteTargets = targets.filter((item) => item.type === FileEntityTypes.File)
      await notesStore.getByFolder(folderIds.value)
      const notesInFolders = folderTargets.flatMap((item) => notesStore.getNoteByFolder(item.entity.$id))
      const noteIds = new Set([...notesInFolders.map((note) => note.$id), ...noteTargets.map((item) => item.entity.$id)])
      await Promise.all([...noteIds].map((id) => notesStore.delete(id)))
      await Promise.all(folderTargets.map((item) => foldersStore.delete(item.entity.$id)))
      await Promise.all([foldersStore.getAll(), ...folderIds.value.map((id) => notesStore.getAll(id))])
      await notesStore.getByFolder(folderIds.value)
      for (const item of targets) {
        onEntityDeleted(item)
      }
      isDeleteOpen.value = false
      target.value = null
      deleteTargets.value = []
    } catch (cause) {
      deleteError.value = getErrorMessage(cause)
    } finally {
      isDeleting.value = false
    }
  }

  return {
    isOpen,
    type,
    isSaving,
    error,
    mode,
    target,
    isDeleteOpen,
    isDeleting,
    deleteError,
    open,
    openEdit,
    requestDeleteMany,
    save,
    remove,
  }
}
