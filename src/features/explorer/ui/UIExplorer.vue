<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFolderSelect } from '@/entities/folder'
import { useNoteSelect } from '@/entities/note'
import { type FileTreeNode, UiDynamicIcon, UiFileTree } from '@/shared/ui'
import { Animate, ComponentSize, FileTreeNodeType, StatusTone } from '@/shared/model/enums.ts'
import UIExplorerActions from './UIExplorerActions.vue'
import FolderCreateModal from './FolderCreateModal.vue'
import ExplorerDeleteModal from './ExplorerDeleteModal.vue'
import ImportNoteModal from './ImportNoteModal.vue'
import { useExplorerEntityActions } from '../model/useExplorerEntityActions'
import { useNoteImport } from '../model/useNoteImport'
import { FileEntityTypes } from '../model/types'
import { type StatusView, SyncStatus } from '@/entities/node'
import UiStatus from '../../../shared/ui/UiStatus.vue'
import { useLocalStorage } from '@vueuse/core'

defineOptions({
  name: 'UIExplorer',
})

defineProps<{
  status: StatusView
}>()

const { folders } = useFolderSelect()
const folderIds = computed(() => folders.value.map((folder) => folder.$id))
const { getNoteByFolder } = useNoteSelect(folderIds)

const treeItems = computed(() =>
  folders.value.map((folder) => ({
    id: folder.$id,
    label: folder.name,
    type: FileTreeNodeType.Folder,
    icon: folder.icon,
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
const selectedTreeId = ref('')
const preSelect = defineModel<FileTreeNode | null>('preSelected', { default: null })
const preSelects = ref<FileTreeNode[]>([])
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
  requestDeleteMany,
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
    preSelects.value = preSelects.value.filter((node) => node.id !== deleted.entity.$id)
    if (deleted.type === FileEntityTypes.Folder && selectedFolder.value === deleted.entity.$id) {
      selectedFolder.value = ''
      selectedNote.value = ''
    } else if (deleted.type === FileEntityTypes.File && selectedNote.value === deleted.entity.$id) {
      selectedNote.value = ''
    }
  },
)

const noteImport = useNoteImport(
  selectedFolder,
  folderIds,
  (noteId) => (selectedNote.value = noteId),
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

  const parentFolder = treeItems.value.find((folder) =>
    folder.children?.some((note) => note.id === node.id),
  )
  if (parentFolder) {
    selectedFolder.value = parentFolder.id
    if (!expandedFolderIds.value.includes(parentFolder.id))
      expandedFolderIds.value.push(parentFolder.id)
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

watch(
  () => [selectedFolder.value, selectedNote.value] as const,
  ([folderId, noteId]) => {
    selectedTreeId.value = noteId || folderId
    const noteFolderId = noteId
      ? treeItems.value.find((folder) => folder.children?.some((note) => note.id === noteId))?.id
      : undefined
    const folderToExpand = folderId || noteFolderId
    if (folderToExpand && !expandedFolderIds.value.includes(folderToExpand)) {
      expandedFolderIds.value = [...expandedFolderIds.value, folderToExpand]
    }
  },
  { immediate: true },
)

const folderMap = computed(() =>
  folders.value.reduce(
    (acc, folder) => ({
      ...acc,
      [folder.$id]: folder,
    }),
    {},
  ),
)

const expandSidebar = useLocalStorage('expand-sidebar', true)

// Mobile: sidebar is a top block that collapses by height.
// Desktop (md+): sidebar is a left column that collapses by width and peeks on hover.
const sidebarClasses = computed(() =>
  expandSidebar.value
    ? 'h-56 max-h-56 md:w-65'
    : 'h-10 max-h-10 md:w-10 md:hover:w-65',
)

const sidebarContentClasses = computed(() =>
  expandSidebar.value
    ? ''
    : 'pointer-events-none opacity-0 md:group-hover/sidebar:pointer-events-auto md:group-hover/sidebar:opacity-100',
)
</script>

<template>
  <aside
    class="group/sidebar flex min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden bg-base-300 transition-[width,height,max-height] duration-300 ease-in-out motion-reduce:transition-none md:sticky md:top-0 md:h-full md:max-h-none"
    :class="sidebarClasses"
  >
    <div class="flex h-56 min-h-0 w-full flex-col md:h-full md:w-65">
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
        :count="preSelects.length"
        :deleting="isDeleting"
        :error="deleteError"
        @confirm="remove"
      />
      <ImportNoteModal
        v-model="noteImport.isOpen.value"
        :importing="noteImport.isImporting.value"
        :error="noteImport.error.value"
        @import="noteImport.importNote"
      />
      <UIExplorerActions
        class="relative z-10 shrink-0"
        :selected-node="preSelect"
        :selected-nodes="preSelects"
        @create-entity="open"
        @import-note="noteImport.open"
        @edit="openEdit"
        @delete="requestDeleteMany"
        @expand-all="expandAllFolders"
        @collapse-all="collapseAllFolders"
        v-model:expand-sidebar="expandSidebar"
      />
      <div
        class="min-h-0 flex-1 overflow-y-auto transition-opacity duration-200 ease-in-out motion-reduce:transition-none"
        :class="sidebarContentClasses"
      >
        <UiFileTree
          withDoubleClick
          @select="onSelectTree"
          @pre-select="onPreSelectTree"
          v-model:pre-select="preSelect"
          v-model:pre-selects="preSelects"
          v-model:expanded="expandedFolderIds"
          v-model="selectedTreeId"
          :items="treeItems"
        >
          <template #icon="scope">
            <div
              v-if="scope.node?.children"
              class="p-1 rounded-sm"
              :class="folderMap[scope.node.id]?.color"
            >
              <UiDynamicIcon :name="folderMap[scope.node.id]?.icon" class="size-4 shrink-0" />
            </div>
          </template>
          <template #label="scope">
            <span v-bind="scope">{{ scope.node.label }}</span>
            <UiStatus
              v-if="!scope.node?.children && scope.selected && status.status === SyncStatus.Saving"
              :size="ComponentSize.Medium"
              :tone="StatusTone.Warning"
              :animate="Animate.Bounce"
            />
            <span v-else class="pr-4"></span>
          </template>
        </UiFileTree>
      </div>
    </div>
  </aside>
</template>

<style scoped></style>
