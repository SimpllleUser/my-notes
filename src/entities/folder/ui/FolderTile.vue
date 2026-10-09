<script setup lang="ts">
import { shallowRef, watch, type Component } from 'vue'
import { resolveLucideIcon } from '@/shared/lib/lucide'
import { UiIconButton } from '@/shared/ui'
import { ButtonVariant } from '@/shared/model/enums.ts'
import type { FolderTileData } from '@/entities/folder'

const props = defineProps<{
  folder: FolderTileData
  active?: boolean
  actions?: boolean
}>()

defineEmits<{ edit: [FolderTileData]; delete: [FolderTileData] }>()

const iconComponent = shallowRef<Component | null>(null)
const editIcon = shallowRef<Component | null>(null)
const deleteIcon = shallowRef<Component | null>(null)

watch(
  () => props.folder.icon,
  async (icon) => {
    iconComponent.value = await resolveLucideIcon(icon)
  },
  { immediate: true },
)

watch(
  () => props.actions,
  async (actions) => {
    if (!actions) return
    editIcon.value = await resolveLucideIcon('Pencil')
    deleteIcon.value = await resolveLucideIcon('Trash')
  },
  { immediate: true },
)
</script>

<template>
  <div class="group relative">
    <div
      class="flex aspect-square w-full flex-col justify-between rounded-brutal border-2 border-ink min-w-0 p-3 text-left transition duration-150 hover:-translate-y-1 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
      :class="active ? 'bg-ink text-accent-paper shadow-brutal-sm' : 'bg-bg'"
    >
      <span
        class="grid h-20 w-20 place-items-center rounded-xl border-2 border-ink"
        :class="folder.color"
      >
        <component :is="iconComponent" v-if="iconComponent" :size="40" />
      </span>
      <span>
        <span class="block truncate font-bold" :class="actions && 'max-sm:pr-24'">{{
          folder.name
        }}</span>
        <span v-if="folder.count != null" class="text-xs opacity-70"
          >{{ folder.count }} нотаток</span
        >
      </span>
      <div
        v-if="actions"
        class="absolute right-0 top-2 flex items-center justify-end gap-1 pr-2 opacity-0 transition-opacity duration-150 pointer-events-none max-sm:opacity-100 max-sm:pointer-events-auto group-hover:opacity-100 group-hover:pointer-events-auto"
      >
        <UiIconButton
          label="Редагувати папку"
          :variant="ButtonVariant.Yellow"
          size="sm"
          @click.stop="$emit('edit', folder)"
        >
          <component :is="editIcon" v-if="editIcon" :size="14" />
        </UiIconButton>
        <UiIconButton
          label="Видалити папку"
          :variant="ButtonVariant.Primary"
          size="sm"
          @click.stop="$emit('delete', folder)"
        >
          <component :is="deleteIcon" v-if="deleteIcon" :size="14" />
        </UiIconButton>
      </div>
    </div>
  </div>
</template>
