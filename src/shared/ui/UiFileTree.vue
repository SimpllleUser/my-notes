<script setup lang="ts">
import { File, Folder, FolderOpen } from '@lucide/vue'
import { FileTreeSize } from '@/shared/model/enums.ts'
import { FileTreeNodeType } from '@/shared/model/enums.ts'
import UiFileTreeNode from './UiFileTreeNode.vue'
import type { FileTreeNode } from '../model/file-tree.types.ts'
import type { VNodeChild } from 'vue'

withDefaults(
  defineProps<{
    items: FileTreeNode[]
    label?: string
    size?: FileTreeSize
    bordered?: boolean
    withDoubleClick?: boolean
  }>(),
  {
    label: 'File tree',
    size: FileTreeSize.ExtraSmall,
    bordered: false,
    withDoubleClick: false,
  },
)

const selectedId = defineModel<string>({ default: '' })
const expandedIds = defineModel<string[]>('expanded', { default: () => [] })
const preSelectedNode = defineModel<FileTreeNode | null>('preSelect', { default: null })

const emit = defineEmits<{ select: [node: FileTreeNode]; 'pre-select': [node: FileTreeNode] }>()

defineSlots<{
  header?: () => VNodeChild
  empty?: () => VNodeChild
  icon?: (props: { node: FileTreeNode; expanded: boolean; selected: boolean }) => VNodeChild
  label?: (props: { node: FileTreeNode; selected: boolean }) => VNodeChild
}>()

function handleSelect(node: FileTreeNode) {
  if (node.disabled) return
  selectedId.value = node.id
  emit('select', node)
}
function handlePreSelect(node: FileTreeNode) {
  if (node.disabled) return
  preSelectedNode.value = node
  emit('pre-select', node)
}

function handleToggle(id: string, expanded: boolean) {
  const ids = new Set(expandedIds.value)
  if (expanded) ids.add(id)
  else ids.delete(id)
  expandedIds.value = [...ids]
}
</script>

<template>
  <ul
    role="tree"
    :aria-label="label"
    class="menu w-full rounded-box bg-base-300"
    :class="[
      {
        'menu-xs': size === FileTreeSize.ExtraSmall,
        'menu-sm': size === FileTreeSize.Small,
        'menu-md': size === FileTreeSize.Medium,
        'menu-lg': size === FileTreeSize.Large,
        'menu-xl': size === FileTreeSize.ExtraLarge,
        'border border-base-300': bordered,
      },
    ]"
  >
    <slot name="header"></slot>
    <UiFileTreeNode
      :items="items"
      :selected-id="selectedId"
      :expanded-ids="expandedIds"
      @select="handleSelect"
      @pre-select="handlePreSelect"
      :preselected-id="preSelectedNode?.id"
      :withDoubleClick="withDoubleClick"
      @toggle="handleToggle"
    >
      <template #icon="scope">
        <slot name="icon" v-bind="scope">
          <component
            :is="
              scope.node.type === FileTreeNodeType.Folder
                ? scope.expanded
                  ? FolderOpen
                  : Folder
                : File
            "
            class="size-4 shrink-0"
            aria-hidden="true"
          />
        </slot>
      </template>
      <template #label="scope">
        <slot name="label" v-bind="scope">{{ scope.node.label }}</slot>
      </template>
    </UiFileTreeNode>
    <li v-if="items.length === 0" class="menu-disabled">
      <span><slot name="empty">No files</slot></span>
    </li>
  </ul>
</template>
