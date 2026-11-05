<script setup lang="ts">
import { FileEntityTypes } from '@/entities/folder'
import { UiButton, UiPicker } from '@/shared/ui'
import { ButtonSize, ButtonVariant } from '@/shared/model/enums.ts'
import { SquarePlus, ListChevronsDownUp, ListChevronsUpDown } from '@lucide/vue'

const BUTTON_PROPS = {
  variant: ButtonVariant.Ghost,
  size: ButtonSize.ExtraSmall,
}

const emit = defineEmits<{
  'create-entity': [type: FileEntityTypes]
}>()

const entityOptions = [
  { type: FileEntityTypes.File, label: 'File' },
  { type: FileEntityTypes.Folder, label: 'Folder' },
]

function chooseEntity(type: FileEntityTypes, hide: () => void) {
  emit('create-entity', type)
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
    <UiButton :size="BUTTON_PROPS.size" :variant="BUTTON_PROPS.variant" class="menu-title">
      <ListChevronsUpDown :size="12" />
    </UiButton>
    <UiButton :size="BUTTON_PROPS.size" :variant="BUTTON_PROPS.variant" class="menu-title">
      <ListChevronsDownUp :size="12" />
    </UiButton>
  </div>
</template>

<style scoped></style>
