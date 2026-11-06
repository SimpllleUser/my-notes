<script setup lang="ts">
import { type FileTreeNode, UiButton, UiDropdown, UiPicker } from '@/shared/ui'
import { ButtonSize, ButtonVariant } from '@/shared/model/enums.ts'
import { Ellipsis, SquarePlus, ListChevronsDownUp, ListChevronsUpDown } from '@lucide/vue'
import { ExplorerItemAction, FileEntityTypes } from '../model/types'

const BUTTON_PROPS = {
  variant: ButtonVariant.Ghost,
  size: ButtonSize.ExtraSmall,
}

const emit = defineEmits<{
  'create-entity': [type: FileEntityTypes]
  edit: [node: FileTreeNode]
  delete: [nodes: FileTreeNode[]]
  'expand-all': []
  'collapse-all': []
}>()

const props = defineProps<{ selectedNode: FileTreeNode | null; selectedNodes: FileTreeNode[] }>()

const entityOptions = [
  { type: FileEntityTypes.File, label: 'Note' },
  { type: FileEntityTypes.Folder, label: 'Folder' },
]

function chooseEntity(type: FileEntityTypes, hide: () => void) {
  emit('create-entity', type)
  hide()
}

function runAction(action: ExplorerItemAction, node: FileTreeNode | null, hide: () => void) {
  if (node && action === ExplorerItemAction.Edit) emit('edit', node)
  if (node && action === ExplorerItemAction.Delete) {
    emit('delete', props.selectedNodes.length ? props.selectedNodes : [node])
  }
  hide()
}
</script>

<template>
  <div class="flex items-center justify-end pr-1 py-1">
    <UiPicker panel-class="!p-1">
      <template #trigger="triggerProps">
        <UiButton
          :size="BUTTON_PROPS.size"
          :variant="BUTTON_PROPS.variant"
          class="menu-title"
          aria-label="Створити файл або папку"
          @click="triggerProps.toggle"
        >
          <SquarePlus :size="12" />
        </UiButton>
      </template>
      <template #content="{ hide }">
        <div class="flex min-w-28 flex-col gap-0.5">
          <button
            v-for="option in entityOptions"
            :key="option.type"
            class="rounded px-2 py-1 text-left text-xs hover:bg-base-200"
            @click="chooseEntity(option.type, hide)"
          >
            {{ option.label }}
          </button>
        </div>
      </template>
    </UiPicker>
    <UiButton
      :size="BUTTON_PROPS.size"
      :variant="BUTTON_PROPS.variant"
      class="menu-title"
      aria-label="Expand all folders"
      @click="emit('expand-all')"
    >
      <ListChevronsUpDown :size="12" />
    </UiButton>
    <UiButton
      :size="BUTTON_PROPS.size"
      :variant="BUTTON_PROPS.variant"
      class="menu-title"
      aria-label="Collapse all folders"
      @click="emit('collapse-all')"
    >
      <ListChevronsDownUp :size="12" />
    </UiButton>
    <UiDropdown label="Selected item actions" :disabled="!selectedNode" content-class="w-36 p-1">
      <template #trigger="{ props: triggerProps }">
        <UiButton
          v-bind="triggerProps"
          :size="BUTTON_PROPS.size"
          :variant="BUTTON_PROPS.variant"
          :disabled="!selectedNode"
          class="menu-title"
          :aria-label="props.selectedNodes.length > 1 ? `Actions for ${props.selectedNodes.length} selected items` : 'Edit or delete selected item'"
        >
          <Ellipsis :size="14" />
        </UiButton>
      </template>
      <template #default="{ hide }">
        <li>
          <button type="button" :disabled="props.selectedNodes.length > 1" @click="runAction(ExplorerItemAction.Edit, selectedNode, hide)">
            Edit
          </button>
        </li>
        <li>
          <button
            type="button"
            class="text-error"
            @click="runAction(ExplorerItemAction.Delete, selectedNode, hide)"
          >
            Delete{{ props.selectedNodes.length > 1 ? ` (${props.selectedNodes.length})` : '' }}
          </button>
        </li>
      </template>
    </UiDropdown>
  </div>
</template>

<style scoped></style>
