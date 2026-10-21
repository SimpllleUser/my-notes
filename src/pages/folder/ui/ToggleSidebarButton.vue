<script setup lang="ts">
import { UiIconButton } from '@/shared/ui'
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue'

defineOptions({
  name: 'ToggleSidebarButton',
})
defineProps<{
  collapsed: boolean
}>()

defineEmits(['click'])
</script>

<template>
  <UiIconButton
    :label="collapsed ? 'Показати список нотаток' : 'Мінімізувати список нотаток'"
    :aria-expanded="collapsed ? 'false' : 'true'"
    aria-controls="notes-sidebar"
    @click="$emit('click')"
  >
    <PanelLeftClose v-if="collapsed" :size="18" />
    <PanelLeftOpen v-else :size="18" />
  </UiIconButton>
</template>

<style scoped></style>
