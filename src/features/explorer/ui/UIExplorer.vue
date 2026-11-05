<script setup lang="ts">
import { type Component, computed, ref, shallowRef, watch } from 'vue'
import { useFolderSelect } from '@/entities/folder'
import { useNoteSelect } from '@/entities/note/model/useNoteSelect.ts'
import { resolveLucideIcon } from '@/shared/lib/lucide.ts'
import { type FileTreeNode, UiFileTree } from '@/shared/ui'
import { FileTreeNodeType } from '@/shared/model/enums.ts'
import UIExplorerActions from '@/features/explorer/ui/UIExplorerActions.vue'

defineOptions({
  name: 'UIExplorer',
})

const { folders } = useFolderSelect()
const folderIds = computed(() => folders.value.map((folder) => folder.$id))
const { getNoteByFolder } = useNoteSelect(undefined, folderIds)

const iconsList = ref<Record<string, Component | null>>({})
const getIcon = (icon: string) => {
  if (icon in iconsList.value) return iconsList.value[icon]
  resolveLucideIcon(icon).then((value) => {
    iconsList.value[icon] = shallowRef(value)
  })
}

watch(
  () => folders.value,
  (items) => {
    if (!items.length) return
    items.forEach((item) => {
      getIcon(item.icon)
    })
  },
  { deep: true, immediate: true },
)
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

const onSelectTree = (value: FileTreeNode) => {
  if (value.children) {
    selectedFolder.value = value.id
  } else {
    selectedNote.value = value.id
  }
}
</script>

<template>
  <div>
    <UIExplorerActions :preSelect="preSelect" />
    <UiFileTree
      withDoubleClick
      @select="onSelectTree"
      v-model:pre-select="preSelect"
      :items="treeItems"
      :expanded-ids="[selectedFolder]"
    />
  </div>
</template>

<style scoped></style>
