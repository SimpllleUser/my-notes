<script setup lang="ts">
import { UiCard, UiSearchInput } from '@/shared/ui'
import { NoteListItem, type Note } from '@/entities/note'

defineProps<{ folderName?: string; notes: Note[]; activeNoteId: string }>()
const search = defineModel<string>('search', { default: '' })
const emit = defineEmits<{ select: [note: Note]; create: [] }>()

const getNoteDate = (date: string) => new Date(date).toLocaleDateString()
</script>

<template>
  <UiCard compact>
    <div class="mb-4 flex items-center justify-between gap-3">
      <slot name="header-left" />
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Вибрана папка</p>
        <h2 class="wrap-break-word text-xl font-black sm:text-2xl">{{ folderName }}</h2>
      </div>
      <slot name="header-right" />
    </div>
    <UiSearchInput v-model="search" class="mb-4" placeholder="Пошук нотаток..." />
    <div class="space-y-3">
      <NoteListItem
        v-for="note in notes"
        :key="note.$id"
        :title="note.name"
        :preview="note?.preview ?? ''"
        :updated="getNoteDate(note.$updatedAt)"
        :active="activeNoteId === note.$id"
        @click="emit('select', note)"
      />
      <p
        v-if="notes.length === 0"
        class="rounded-brutal border-2 border-dashed border-ink p-5 text-center text-sm"
      >
        Not found
      </p>
    </div>
  </UiCard>
</template>
