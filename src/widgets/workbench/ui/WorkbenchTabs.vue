<script setup lang="ts">
import { Columns2, X } from '@lucide/vue'
import { ButtonSize, ButtonVariant } from '@/shared/model/enums.ts'
import { UiButton } from '@/shared/ui'

defineOptions({ name: 'WorkbenchTabs' })

export interface WorkbenchTab {
  id: string
  title: string
}

const TAB_DRAG_TYPE = 'application/x-note-tab'

defineProps<{
  tabs: WorkbenchTab[]
  activeId: string | null
  /** Група у фокусі підсвічує активну вкладку. */
  focused: boolean
  canSplit: boolean
}>()

const emit = defineEmits<{
  select: [noteId: string]
  close: [noteId: string]
  split: []
  dropTab: [noteId: string]
}>()

function onDragStart(event: DragEvent, noteId: string) {
  event.dataTransfer?.setData(TAB_DRAG_TYPE, noteId)
}

function onDrop(event: DragEvent) {
  const noteId = event.dataTransfer?.getData(TAB_DRAG_TYPE)
  if (noteId) emit('dropTab', noteId)
}
</script>

<template>
  <div
    class="flex shrink-0 items-center border-b border-base-300 bg-base-200"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <div role="tablist" class="flex min-w-0 flex-1 overflow-x-auto">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        draggable="true"
        class="group flex max-w-48 shrink-0 items-center border-t-2 text-sm"
        :class="
          tab.id === activeId
            ? ['bg-base-100', focused ? 'border-primary' : 'border-base-content/30']
            : 'border-transparent opacity-70 hover:opacity-100'
        "
        @dragstart="onDragStart($event, tab.id)"
        @auxclick.middle.prevent="emit('close', tab.id)"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="tab.id === activeId"
          class="min-w-0 truncate py-1.5 pl-3 pr-1"
          @click="emit('select', tab.id)"
        >
          {{ tab.title || 'Без назви' }}
        </button>
        <button
          type="button"
          class="mr-1 rounded p-0.5 opacity-0 hover:bg-base-300 focus-visible:opacity-100 group-hover:opacity-100"
          :class="{ 'opacity-100': tab.id === activeId }"
          :aria-label="`Закрити ${tab.title}`"
          @click="emit('close', tab.id)"
        >
          <X :size="12" />
        </button>
      </div>
    </div>
    <UiButton
      :size="ButtonSize.ExtraSmall"
      :variant="ButtonVariant.Ghost"
      :disabled="!canSplit"
      class="mx-1 shrink-0"
      aria-label="Розділити екран праворуч"
      @click="emit('split')"
    >
      <Columns2 :size="14" />
    </UiButton>
  </div>
</template>
