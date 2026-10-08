<script setup lang="ts">
import { UiButton, UiCard } from '@/shared/ui'
import { useTheme } from '@/shared/lib/theme'
import { FolderSidebar } from '@/widgets/folder-sidebar'
import { NoteListPanel } from '@/widgets/note-list-panel'
import { NoteEditorPanel } from '@/widgets/note-editor-panel'
import { ColorPicker } from '@/features/color-picker'
import { IconPicker } from '@/features/icon-picker'
import { useUIKit } from '../model/useUIKit.ts'
import { usePickerExamples } from '../model/usePickerExamples.ts'

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

const { color, icon, inlineColor, inlineIcon, customColor, customIcon, snippets } =
  usePickerExamples()
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

      <section class="mt-5 sm:mt-8">
        <div class="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-ink-light">Features</p>
            <h2 class="text-xl font-black tracking-tight sm:text-2xl">Пікери</h2>
          </div>
          <p class="text-sm text-ink-light">ColorPicker та IconPicker — з popover і без нього</p>
        </div>

        <div class="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          <UiCard as="section">
            <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Popover</p>
            <h3 class="mt-1 text-lg font-black">За замовчуванням</h3>
            <p class="mt-1 text-sm leading-5 text-ink-light">
              Контент відкривається у панелі під тригером і закривається після вибору.
            </p>

            <div class="mt-4 flex flex-wrap items-center gap-3">
              <ColorPicker v-model="color" label="Колір" />
              <IconPicker v-model="icon" label="Іконка" />
            </div>

            <p class="mt-3 text-sm">
              Вибрано: <b>{{ color ?? '—' }}</b> · <b>{{ icon ?? '—' }}</b>
            </p>

            <pre
              class="mt-4 overflow-x-auto rounded-brutal border-2 border-ink bg-bg p-3 text-xs leading-5"
            ><code>{{ snippets.popover }}</code></pre>
          </UiCard>

          <UiCard as="section">
            <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Inline</p>
            <h3 class="mt-1 text-lg font-black">Без popover</h3>
            <p class="mt-1 text-sm leading-5 text-ink-light">
              <code class="rounded border border-ink bg-bg px-1">:popover="false"</code> рендерить
              контент на місці: без тригера і панелі, одразу видно весь вміст.
            </p>

            <div class="mt-4 max-w-sm space-y-4">
              <ColorPicker v-model="inlineColor" :popover="false" label="Колір" />
              <IconPicker v-model="inlineIcon" :popover="false" label="Іконка" />
            </div>

            <p class="mt-3 text-sm">
              Вибрано: <b>{{ inlineColor ?? '—' }}</b> · <b>{{ inlineIcon ?? '—' }}</b>
            </p>

            <pre
              class="mt-4 overflow-x-auto rounded-brutal border-2 border-ink bg-bg p-3 text-xs leading-5"
            ><code>{{ snippets.inline }}</code></pre>
          </UiCard>

          <UiCard as="section" class="md:col-span-2 xl:col-span-1">
            <p class="text-xs font-bold uppercase tracking-wider text-ink-light">
              Trigger slot + auto-init
            </p>
            <h3 class="mt-1 text-lg font-black">Кастомний тригер</h3>
            <p class="mt-1 text-sm leading-5 text-ink-light">
              Слот <code class="rounded border border-ink bg-bg px-1">trigger</code> отримує
              <code class="rounded border border-ink bg-bg px-1">open</code>,
              <code class="rounded border border-ink bg-bg px-1">toggle</code>,
              <code class="rounded border border-ink bg-bg px-1">show</code>,
              <code class="rounded border border-ink bg-bg px-1">hide</code>, а ColorPicker
              додатково <code class="rounded border border-ink bg-bg px-1">value</code>, IconPicker
              — <code class="rounded border border-ink bg-bg px-1">icon</code>.
              <code class="rounded border border-ink bg-bg px-1">auto-init</code> випадково заповнює
              порожній model при монтуванні.
            </p>

            <div class="mt-4 flex flex-wrap items-center gap-3">
              <ColorPicker v-model="customColor" label="Колір папки" auto-init>
                <template #trigger="{ toggle, value }">
                  <UiButton @click="toggle">
                    <span class="h-4 w-4 rounded border-2 border-ink" :class="value ?? 'bg-bg'" />
                    Колір
                  </UiButton>
                </template>
              </ColorPicker>

              <IconPicker v-model="customIcon" label="Іконка папки" auto-init>
                <template #trigger="{ toggle, icon: Icon }">
                  <UiButton variant="yellow" size="sm" @click="toggle">
                    <component :is="Icon" v-if="Icon" :size="16" />
                    Обрати іконку
                  </UiButton>
                </template>
              </IconPicker>
            </div>

            <p class="mt-3 text-sm">
              Вибрано: <b>{{ customColor ?? '—' }}</b> · <b>{{ customIcon ?? '—' }}</b>
            </p>

            <pre
              class="mt-4 overflow-x-auto rounded-brutal border-2 border-ink bg-bg p-3 text-xs leading-5"
            ><code>{{ snippets.trigger }}</code></pre>
          </UiCard>
        </div>
      </section>
    </div>
  </main>
</template>
