<script setup lang="ts">
import { File, Folder, FolderOpen } from '@lucide/vue'
import { FileTreeNodeType } from '@/shared/model/enums.ts'
import type { FileTreeNode } from './file-tree.types.ts'

defineOptions({ name: 'UiFileTreeNode' })

const props = defineProps<{
  items: FileTreeNode[]
  selectedId?: string
  expandedIds: string[]
}>()

const emit = defineEmits<{
  select: [node: FileTreeNode]
  toggle: [id: string, expanded: boolean]
}>()

function isExpanded(id: string) {
  return props.expandedIds.includes(id)
}

function handleFolderClick(event: MouseEvent, node: FileTreeNode) {
  if (node.disabled) {
    event.preventDefault()
    return
  }

  emit('select', node)
}

function handleToggle(event: Event, id: string) {
  emit('toggle', id, (event.currentTarget as HTMLDetailsElement).open)
}
</script>

<template>
  <li v-for="node in items" :key="node.id" role="none" :class="{ 'menu-disabled': node.disabled }">
    <details
      v-if="node.type === FileTreeNodeType.Folder"
      :open="isExpanded(node.id)"
      @toggle="handleToggle($event, node.id)"
    >
      <summary
        role="treeitem"
        :aria-expanded="isExpanded(node.id)"
        :aria-selected="selectedId === node.id"
        :aria-disabled="node.disabled || undefined"
        :class="{ 'menu-active': selectedId === node.id }"
        @click="handleFolderClick($event, node)"
      >
        <slot
          name="icon"
          :node="node"
          :expanded="isExpanded(node.id)"
          :selected="selectedId === node.id"
        >
          <component
            :is="isExpanded(node.id) ? FolderOpen : Folder"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
        </slot>
        <slot name="label" :node="node" :selected="selectedId === node.id">
          {{ node.label }}
        </slot>
      </summary>
      <ul v-if="node.children?.length" role="group">
        <UiFileTreeNode
          :items="node.children"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          @select="emit('select', $event)"
          @toggle="(id, expanded) => emit('toggle', id, expanded)"
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
      </ul>
    </details>

    <button
      v-else
      type="button"
      role="treeitem"
      :aria-selected="selectedId === node.id"
      :disabled="node.disabled"
      :class="{ 'menu-active': selectedId === node.id }"
      @click="emit('select', node)"
    >
      <slot name="icon" :node="node" :expanded="false" :selected="selectedId === node.id">
        <File class="size-4 shrink-0" aria-hidden="true" />
      </slot>
      <slot name="label" :node="node" :selected="selectedId === node.id">
        {{ node.label }}
      </slot>
    </button>
  </li>
</template>
