<script setup lang="ts">
import { UiCard, UiIconButton, UiSearchInput } from '@/shared/ui'
import { ButtonVariant } from '@/shared/model/enums.ts'
import { NoteListItem, type Note } from '@/entities/note'

defineProps<{ folderName?: string; notes: Note[]; activeNoteId: number }>()
const search = defineModel<string>('search', { default: '' })
const emit = defineEmits<{ select: [note: Note]; create: [] }>()
</script>

<template>
  <UiCard compact>
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Вибрана папка</p>
        <h2 class="break-words text-xl font-black sm:text-2xl">{{ folderName }}</h2>
      </div>
      <UiIconButton
        label="Створити нотатку"
        :variant="ButtonVariant.Primary"
        @click="emit('create')"
        >+</UiIconButton
      >
    </div>
    <UiSearchInput v-model="search" class="mb-4" placeholder="Пошук нотаток..." />
    <div class="space-y-3">
      <NoteListItem
        v-for="note in notes"
        :key="note.id"
        :title="note.title"
        :preview="note.preview"
        :updated="note.updated"
        :active="activeNoteId === note.id"
        @click="emit('select', note)"
      />
      <p
        v-if="notes.length === 0"
        class="rounded-brutal border-2 border-dashed border-ink p-5 text-center text-sm"
      >
        Нотаток не знайдено
      </p>
    </div>
  </UiCard>
</template>
