<script setup lang="ts">
import { FileUp } from '@lucide/vue'
import { ButtonVariant, ComponentSize, DaisyColor } from '@/shared/model/enums.ts'
import { UiButton } from '@/shared/ui'
import { useAppendImport } from '../model/useAppendImport'
import ImportNoteModal from './ImportNoteModal.vue'

const props = defineProps<{ noteId: string }>()
const { isOpen, isImporting, error, open, importInto } = useAppendImport(() => props.noteId)
</script>

<template>
  <UiButton
    :size="ComponentSize.Small"
    :variant="ButtonVariant.Ghost"
    :color="DaisyColor.Neutral"
    title="Імпортувати в цю нотатку"
    aria-label="Імпортувати в цю нотатку"
    @click="open"
  >
    <FileUp :size="16" />
  </UiButton>
  <ImportNoteModal
    v-model="isOpen"
    title="Імпорт у нотатку"
    :ask-name="false"
    :importing="isImporting"
    :error="error"
    @import="(_, json) => importInto(json)"
  />
</template>
