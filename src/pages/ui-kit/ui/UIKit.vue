<script setup lang="ts">
import { UiButton } from '@/shared/ui'
import { useTheme } from '@/shared/lib/theme'
import { FolderSidebar } from '@/widgets/folder-sidebar'
import { NoteListPanel } from '@/widgets/note-list-panel'
import { NoteEditorPanel } from '@/widgets/note-editor-panel'
import { useUIKit } from '../model/useUIKit.ts'

const { theme, toggleTheme } = useTheme()

const {
  folders,
  activeFolderId,
  activeNoteId,
  search,
  editorContent,
  activeFolder,
  activeNote,
  visibleNotes,
  selectFolder,
  selectNote,
  createNote,
  addFolder,
} = useUIKit()
</script>

<template>
  <main class="min-h-screen bg-bg px-4 py-4 text-ink sm:px-6 lg:px-10 lg:py-8">
    <div class="mx-auto max-w-[1440px]">
      <header class="mb-4 flex sm:mb-6 items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="grid h-11 w-11 place-items-center rounded-brutal border-3 border-ink bg-primary text-xl shadow-brutal-sm"
          >
            ✦
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-ink-light">Workspace</p>
            <h1 class="text-2xl font-black tracking-tight sm:text-3xl">my-notes</h1>
          </div>
        </div>
        <UiButton variant="paper" @click="toggleTheme">
          <span aria-hidden="true">{{ theme === 'dark' ? '☾' : '☼' }}</span>
          <span class="hidden sm:inline">Тема</span>
        </UiButton>
      </header>

      <section class="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-[280px_330px_minmax(0,1fr)]">
        <FolderSidebar
          :folders="folders"
          :active-folder-id="activeFolderId"
          @select="selectFolder"
          @create="addFolder"
        />

        <NoteListPanel
          v-model:search="search"
          :folder-name="activeFolder?.name"
          :notes="visibleNotes"
          :active-note-id="activeNoteId"
          @select="selectNote"
          @create="createNote"
        />

        <NoteEditorPanel
          v-model:content="editorContent"
          class="md:col-span-2 lg:col-span-1"
          :title="activeNote?.title"
        />
      </section>
    </div>
  </main>
</template>
