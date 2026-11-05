import { ref, type ComputedRef, type Ref } from 'vue'
import { FileEntityTypes, useFoldersStore } from '@/entities/folder'
import { useNotesStore } from '@/entities/note'
import { FileTreeNodeType, FolderColor } from '@/shared/model/enums.ts'
import type { FileTreeNode } from '@/shared/ui'
import { ExplorerFormMode } from './types'
import type { ExplorerCreatePayload, ExplorerEntity } from './types'

export function useExplorerEntityActions(
  folderId: Ref<string>,
  folderIds: ComputedRef<string[]>,
  onNoteCreated: (noteId: string) => void,
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

  function requestDelete(node: FileTreeNode) {
    const entity = getEntity(node)
    if (!entity) return
    target.value = entity
    deleteError.value = ''
    isDeleteOpen.value = true
  }

  function getErrorMessage(cause: unknown) {
    return cause instanceof Error ? cause.message : 'Could not complete the action. Please try again.'
  }

  async function create(payload: ExplorerCreatePayload) {
    if (!type.value || payload.type !== type.value || isSaving.value) return
    isSaving.value = true
    error.value = ''

    try {
      if (mode.value === ExplorerFormMode.Edit && target.value?.type === FileEntityTypes.Folder) {
        const folder = target.value.entity
        await foldersStore.update({ ...folder, name: payload.name, color: payload.color, icon: payload.icon })
        await foldersStore.getAll()
        await notesStore.getByFolder(folderIds.value)
      } else if (mode.value === ExplorerFormMode.Edit && target.value?.type === FileEntityTypes.File) {
        const entity = target.value.entity
        const note = await notesStore.update({ ...entity, name: payload.name })
        await Promise.all([
          notesStore.getAll(entity.folder),
          notesStore.getByFolder(folderIds.value),
        ])
        if (note) onNoteCreated(note.$id)
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
        if (note) onNoteCreated(note.$id)
      }

      isOpen.value = false
    } catch (cause) {
      error.value = getErrorMessage(cause)
    } finally {
      isSaving.value = false
    }
  }

  async function remove() {
    const current = target.value
    if (!current || isDeleting.value) return
    isDeleting.value = true
    deleteError.value = ''

    try {
      if (current.type === FileEntityTypes.Folder) {
        await notesStore.getByFolder(folderIds.value)
        const notes = notesStore.getNoteByFolder(current.entity.$id)
        await Promise.all(notes.map((note) => notesStore.delete(note.$id)))
        await foldersStore.delete(current.entity.$id)
        await foldersStore.getAll()
        await notesStore.getByFolder(folderIds.value)
      } else {
        await notesStore.delete(current.entity.$id)
        await Promise.all([
          notesStore.getAll(current.entity.folder),
          notesStore.getByFolder(folderIds.value),
        ])
      }
      onEntityDeleted(current)
      isDeleteOpen.value = false
      target.value = null
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
    requestDelete,
    create,
    remove,
  }
}
