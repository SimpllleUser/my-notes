<script setup lang="ts">
import { type FileTreeNode, UiButton } from '@/shared/ui'
import { ButtonSize, ButtonVariant } from '@/shared/model/enums.ts'
import { SquarePlus, ListChevronsDownUp, ListChevronsUpDown } from '@lucide/vue'

const BUTTON_PROPS = {
  variant: ButtonVariant.Ghost,
  size: ButtonSize.ExtraSmall,
}

defineProps<{
  preSelect?: FileTreeNode | null
}>()
</script>

<template>
  <div class="flex items-center justify-end pr-1 py-1">
    <UiButton :size="BUTTON_PROPS.size" :variant="BUTTON_PROPS.variant" class="menu-title">
      <SquarePlus :size="12" />
    </UiButton>
    <UiButton :size="BUTTON_PROPS.size" :variant="BUTTON_PROPS.variant" class="menu-title">
      <ListChevronsUpDown :size="12" />
    </UiButton>
    <UiButton :size="BUTTON_PROPS.size" :variant="BUTTON_PROPS.variant" class="menu-title">
      <ListChevronsDownUp :size="12" />
    </UiButton>
  </div>
</template>

<style scoped></style>
