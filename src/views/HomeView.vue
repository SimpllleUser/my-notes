<script setup lang="ts">
import { computed, ref } from 'vue'
import TextEditor from '@/share/TextEditor.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIconButton from '@/components/ui/UiIconButton.vue'
import UiSearchInput from '@/components/ui/UiSearchInput.vue'
import UiStatus from '@/components/ui/UiStatus.vue'
import FolderTile from '@/components/FolderTile.vue'
import NoteListItem from '@/components/NoteListItem.vue'

type Folder = { id: number; name: string; color: string; count: number }
type Note = { id: number; title: string; preview: string; updated: string; folderId: number }

const folders = ref<Folder[]>([
  { id: 1, name: 'Особисте', color: 'bg-primary', count: 12 },
  { id: 2, name: 'Робота', color: 'bg-secondary-blue', count: 8 },
  { id: 3, name: 'Навчання', color: 'bg-primary-yellow', count: 5 },
  { id: 4, name: 'Ідеї', color: 'bg-secondary-green', count: 9 },
])

const notes = ref<Note[]>([
  { id: 1, title: 'План на тиждень', preview: 'Сфокусуватися на головних задачах та залишити час для відпочинку.', updated: 'Сьогодні, 10:42', folderId: 1 },
  { id: 2, title: 'Книги, які хочу прочитати', preview: 'Зібрати список рекомендацій і вибрати наступну книгу.', updated: 'Вчора', folderId: 1 },
  { id: 3, title: 'Нотатки з конференції', preview: 'Дизайн має допомагати користувачу приймати рішення.', updated: '12 жовтня', folderId: 1 },
  { id: 4, title: 'Результати зустрічі', preview: 'Наступні кроки для команди та домовленості по релізу.', updated: '10 жовтня', folderId: 2 },
  { id: 5, title: 'Курс з типографіки', preview: 'Основні принципи ритму, контрасту та ієрархії.', updated: '8 жовтня', folderId: 3 },
])

const activeFolderId = ref(1)
const activeNoteId = ref(1)
const search = ref('')
const editorContent = ref('<h1>План на тиждень</h1><p>Невеликий план допомагає зберігати фокус і не перевантажувати себе.</p><h2>Головні задачі</h2><ul><li>Завершити дизайн головного екрану</li><li>Підготувати нотатки до зустрічі</li><li>Залишити вечір для відпочинку</li></ul>')

const activeFolder = computed(() => folders.value.find((folder) => folder.id === activeFolderId.value))
const activeNote = computed(() => notes.value.find((note) => note.id === activeNoteId.value))
const visibleNotes = computed(() => notes.value.filter((note) => note.folderId === activeFolderId.value && `${note.title} ${note.preview}`.toLowerCase().includes(search.value.toLowerCase())))

function selectFolder(folderId: number) {
  activeFolderId.value = folderId
  const firstNote = notes.value.find((note) => note.folderId === folderId)
  if (firstNote) selectNote(firstNote)
}

function selectNote(note: Note) {
  activeNoteId.value = note.id
  editorContent.value = `<h1>${note.title}</h1><p>${note.preview}</p>`
}

function createNote() {
  const newNote: Note = { id: Date.now(), title: 'Нова нотатка', preview: 'Почніть писати тут...', updated: 'Щойно', folderId: activeFolderId.value }
  notes.value.unshift(newNote)
  activeNoteId.value = newNote.id
  editorContent.value = '<h1>Нова нотатка</h1><p>Почніть писати тут...</p>'
}
</script>

<template>
  <main class="min-h-screen bg-bg px-4 py-4 text-ink sm:px-6 lg:px-10 lg:py-8">
    <div class="mx-auto max-w-[1440px]">
      <header class="mb-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-brutal border-3 border-ink bg-primary text-xl shadow-brutal-sm">✦</div>
          <div><p class="text-xs font-bold uppercase tracking-[0.2em] text-ink-light">Workspace</p><h1 class="text-2xl font-black tracking-tight sm:text-3xl">my-notes</h1></div>
        </div>
        <UiButton class="hidden sm:inline-flex" variant="paper">☼ <span>Тема</span></UiButton>
      </header>

      <section class="grid gap-5 lg:grid-cols-[280px_330px_minmax(0,1fr)]">
        <UiCard as="aside" compact>
          <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black">Папки</h2><UiIconButton label="Додати папку" variant="yellow" size="sm">+</UiIconButton></div>
          <div class="grid grid-cols-2 gap-3">
            <FolderTile v-for="folder in folders" :key="folder.id" :name="folder.name" :count="folder.count" :color="folder.color" :active="activeFolderId === folder.id" @click="selectFolder(folder.id)" />
          </div>
          <div class="mt-8 rounded-brutal border-2 border-ink bg-primary-yellow p-4 shadow-brutal-sm"><p class="text-sm font-black">Швидка підказка</p><p class="mt-1 text-sm leading-5">Створюйте папки для проєктів, навчання та особистих ідей.</p></div>
        </UiCard>

        <UiCard compact>
          <div class="mb-4 flex items-center justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-wider text-ink-light">Вибрана папка</p><h2 class="text-2xl font-black">{{ activeFolder?.name }}</h2></div><UiIconButton label="Створити нотатку" variant="primary" @click="createNote">+</UiIconButton></div>
          <UiSearchInput v-model="search" class="mb-4" placeholder="Пошук нотаток..." />
          <div class="space-y-3">
            <NoteListItem v-for="note in visibleNotes" :key="note.id" :title="note.title" :preview="note.preview" :updated="note.updated" :active="activeNoteId === note.id" @click="selectNote(note)" />
            <p v-if="visibleNotes.length === 0" class="rounded-brutal border-2 border-dashed border-ink p-5 text-center text-sm">Нотаток не знайдено</p>
          </div>
        </UiCard>

        <UiCard as="section" class="flex min-h-[620px] flex-col overflow-hidden !p-0">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b-3 border-ink px-5 py-4"><div><p class="text-xs font-bold uppercase tracking-wider text-ink-light">Редактор</p><h2 class="text-xl font-black">{{ activeNote?.title }}</h2></div><UiStatus label="Збережено" /></div>
          <TextEditor v-model:content="editorContent" class="m-4 flex-1 sm:m-6" />
        </UiCard>
      </section>
    </div>
  </main>
</template>
