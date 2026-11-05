<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFolderSelect } from '@/entities/folder'
import { useNoteSelect } from '@/entities/note'
import { type FileTreeNode, UiFileTree } from '@/shared/ui'
import { FileTreeNodeType } from '@/shared/model/enums.ts'
import UIExplorerActions from './UIExplorerActions.vue'
import FolderCreateModal from './FolderCreateModal.vue'
import ExplorerDeleteModal from './ExplorerDeleteModal.vue'
import { useExplorerEntityActions } from '../model/useExplorerEntityActions'
import { FileEntityTypes } from '../model/types'

defineOptions({
  name: 'UIExplorer',
})

const { folders } = useFolderSelect()
const folderIds = computed(() => folders.value.map((folder) => folder.$id))
const { getNoteByFolder } = useNoteSelect(folderIds)

const treeItems = computed(() =>
  folders.value.map((folder) => ({
    id: folder.$id,
    label: folder.name,
    type: FileTreeNodeType.Folder,
    children:
      getNoteByFolder(folder.$id)?.map((note) => ({
        id: note.$id,
        label: note.name,
        type: FileTreeNodeType.File,
      })) || [],
  })),
)

const selectedFolder = defineModel<string>('folder', { default: '' })
const selectedNote = defineModel<string>('note', { default: '' })
const preSelect = defineModel<FileTreeNode | null>('preSelected', { default: null })
const expandedFolderIds = ref<string[]>([])
const {
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
  save,
  remove,
} = useExplorerEntityActions(
  selectedFolder,
  folderIds,
  (noteId) => (selectedNote.value = noteId),
  (deleted) => {
    if (
      preSelect.value?.id === deleted.entity.$id ||
      (deleted.type === FileEntityTypes.Folder && selectedFolder.value === deleted.entity.$id)
    ) {
      preSelect.value = null
    }
    if (deleted.type === FileEntityTypes.Folder && selectedFolder.value === deleted.entity.$id) {
      selectedFolder.value = ''
      selectedNote.value = ''
    } else if (deleted.type === FileEntityTypes.File && selectedNote.value === deleted.entity.$id) {
      selectedNote.value = ''
    }
  },
)

const editValue = computed(() => {
  const current = target.value
  if (!current) return undefined
  return current.type === FileEntityTypes.Folder
    ? { name: current.entity.name, color: current.entity.color, icon: current.entity.icon }
    : { name: current.entity.name }
})

function onPreSelectTree(node: FileTreeNode) {
  if (node.type === FileTreeNodeType.Folder) {
    selectedFolder.value = node.id
    if (!expandedFolderIds.value.includes(node.id)) expandedFolderIds.value.push(node.id)
    return
  }

  const parentFolder = treeItems.value.find((folder) => folder.children?.some((note) => note.id === node.id))
  if (parentFolder) {
    selectedFolder.value = parentFolder.id
    if (!expandedFolderIds.value.includes(parentFolder.id)) expandedFolderIds.value.push(parentFolder.id)
  }
}

function onSelectTree(node: FileTreeNode) {
  if (node.type === FileTreeNodeType.Folder) {
    selectedFolder.value = node.id
    if (!expandedFolderIds.value.includes(node.id)) expandedFolderIds.value.push(node.id)
  } else {
    selectedNote.value = node.id
  }
}

function expandAllFolders() {
  expandedFolderIds.value = [...folderIds.value]
}

function collapseAllFolders() {
  expandedFolderIds.value = []
}
</script>

<template>
  <div>
    <FolderCreateModal
      v-model="isOpen"
      :type="type"
      :mode="mode"
      :initial-value="editValue"
      :saving="isSaving"
      :error="error"
      @save="save"
    />
    <ExplorerDeleteModal
      v-model:open="isDeleteOpen"
      :name="target?.entity.name ?? ''"
      :type="target?.type ?? null"
      :deleting="isDeleting"
      :error="deleteError"
      @confirm="remove"
    />
    <UIExplorerActions
      :selected-node="preSelect"
      @create-entity="open"
      @edit="openEdit"
      @delete="requestDelete"
      @expand-all="expandAllFolders"
      @collapse-all="collapseAllFolders"
    />
    <UiFileTree
      withDoubleClick
      @select="onSelectTree"
      @pre-select="onPreSelectTree"
      v-model:pre-select="preSelect"
      :items="treeItems"
      v-model:expanded="expandedFolderIds"
    />
  </div>
</template>

<style scoped></style>
