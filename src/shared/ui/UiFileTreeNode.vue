<script setup lang="ts">
import { File, Folder, FolderOpen } from '@lucide/vue'
import { onBeforeUnmount } from 'vue'
import { FileTreeNodeType } from '@/shared/model/enums.ts'
import type { FileTreeNode } from '../model/file-tree.types.ts'
import type { VNodeChild } from 'vue'

defineOptions({ name: 'UiFileTreeNode' })

const props = withDefaults(
  defineProps<{
    items: FileTreeNode[]
    selectedId?: string
    preselectedId?: string
    expandedIds: string[]
    withDoubleClick?: boolean
  }>(),
  {
    withDoubleClick: false,
  },
)

const emit = defineEmits<{
  select: [node: FileTreeNode]
  'pre-select': [node: FileTreeNode]
  toggle: [id: string, expanded: boolean]
}>()

defineSlots<{
  icon?: (props: { node: FileTreeNode; expanded: boolean; selected: boolean }) => VNodeChild
  label?: (props: { node: FileTreeNode; selected: boolean }) => VNodeChild
}>()

const DOUBLE_ACTIVATION_DELAY_MS = 400
const SYNTHETIC_CLICK_DELAY_MS = 800
let pendingActivation: { nodeId: string; timeout: ReturnType<typeof setTimeout> } | null = null
let suppressedClick: { nodeId: string; timeout: ReturnType<typeof setTimeout> } | null = null

function isExpanded(id: string) {
  return props.expandedIds.includes(id)
}

function clearPendingActivation() {
  if (!pendingActivation) return
  clearTimeout(pendingActivation.timeout)
  pendingActivation = null
}

function clearSuppressedClick() {
  if (!suppressedClick) return
  clearTimeout(suppressedClick.timeout)
  suppressedClick = null
}

function activateFolder(node: FileTreeNode) {
  const shouldExpand = !isExpanded(node.id)
  clearPendingActivation()
  if (props.withDoubleClick) emit('pre-select', node)
  emit('select', node)
  emit('toggle', node.id, shouldExpand)
}

function handleActivation(event: MouseEvent, node: FileTreeNode, isKeyboardActivation = false) {
  if (node.disabled) {
    event.preventDefault()
    return
  }

  if (node.type === FileTreeNodeType.Folder) {
    activateFolder(node)
    return
  }

  if (!props.withDoubleClick || (isKeyboardActivation && event.detail === 0)) {
    clearPendingActivation()
    emit('select', node)
    return
  }

  if (pendingActivation?.nodeId === node.id || event.detail >= 2) {
    clearPendingActivation()
    event.preventDefault()
    emit('select', node)
    return
  }

  clearPendingActivation()
  emit('pre-select', node)
  pendingActivation = {
    nodeId: node.id,
    timeout: setTimeout(clearPendingActivation, DOUBLE_ACTIVATION_DELAY_MS),
  }
}

function handlePointerUp(event: PointerEvent, node: FileTreeNode) {
  if (event.button !== 0 || node.disabled) return

  clearSuppressedClick()
  suppressedClick = {
    nodeId: node.id,
    timeout: setTimeout(clearSuppressedClick, SYNTHETIC_CLICK_DELAY_MS),
  }

  handleActivation(event, node)
}

function handleClick(event: MouseEvent, node: FileTreeNode) {
  if (event.detail !== 0 && suppressedClick?.nodeId === node.id) {
    event.preventDefault()
    clearSuppressedClick()
    return
  }

  if (event.detail === 0) clearSuppressedClick()
  if (node.type === FileTreeNodeType.Folder) event.preventDefault()
  handleActivation(event, node, true)
}

function handleToggle(event: Event, id: string) {
  emit('toggle', id, (event.currentTarget as HTMLDetailsElement).open)
}

onBeforeUnmount(() => {
  clearPendingActivation()
  clearSuppressedClick()
})
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
        class="touch-manipulation select-none"
        :aria-expanded="isExpanded(node.id)"
        :aria-selected="selectedId === node.id"
        :aria-disabled="node.disabled || undefined"
        :class="{
          'menu-active': selectedId === node.id,
          'menu-focus': preselectedId === node.id,
        }"
        @pointerup="handlePointerUp($event, node)"
        @click="handleClick($event, node)"
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
          :preselected-id="preselectedId"
          :expanded-ids="expandedIds"
          :with-double-click="withDoubleClick"
          @select="emit('select', $event)"
          @pre-select="emit('pre-select', $event)"
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
      class="touch-manipulation select-none"
      :aria-selected="selectedId === node.id"
      :disabled="node.disabled"
      :class="{
        'text-primary': selectedId === node.id,
        'menu-focus': preselectedId === node.id,
      }"
      @pointerup="handlePointerUp($event, node)"
      @click="handleClick($event, node)"
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
