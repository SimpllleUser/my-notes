<script setup lang="ts">
import { computed, ref } from 'vue'

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
        <button class="hidden rounded-brutal border-3 border-ink bg-accent-paper px-4 py-2 font-bold shadow-brutal-sm transition hover:-translate-y-0.5 sm:block" type="button">☼ <span class="ml-1">Тема</span></button>
      </header>

      <section class="grid gap-5 lg:grid-cols-[280px_330px_minmax(0,1fr)]">
        <aside class="rounded-brutal-lg border-3 border-ink bg-accent-paper p-4 shadow-brutal">
          <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black">Папки</h2><button class="grid h-8 w-8 place-items-center rounded-brutal border-2 border-ink bg-primary-yellow text-lg font-black" type="button" aria-label="Додати папку">+</button></div>
          <div class="grid grid-cols-2 gap-3">
            <button v-for="folder in folders" :key="folder.id" class="flex aspect-square flex-col justify-between rounded-brutal border-2 border-ink p-3 text-left transition hover:-translate-y-1" :class="activeFolderId === folder.id ? 'bg-ink text-accent-paper shadow-brutal-sm' : 'bg-bg'" type="button" @click="selectFolder(folder.id)">
              <span class="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink text-xl" :class="folder.color">▰</span>
              <span><span class="block truncate font-bold">{{ folder.name }}</span><span class="text-xs opacity-70">{{ folder.count }} нотаток</span></span>
            </button>
          </div>
          <div class="mt-8 rounded-brutal border-2 border-ink bg-primary-yellow p-4 shadow-brutal-sm"><p class="text-sm font-black">Швидка підказка</p><p class="mt-1 text-sm leading-5">Створюйте папки для проєктів, навчання та особистих ідей.</p></div>
        </aside>

        <section class="rounded-brutal-lg border-3 border-ink bg-accent-paper p-4 shadow-brutal">
          <div class="mb-4 flex items-center justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-wider text-ink-light">Вибрана папка</p><h2 class="text-2xl font-black">{{ activeFolder?.name }}</h2></div><button class="grid h-10 w-10 place-items-center rounded-brutal border-2 border-ink bg-primary text-xl font-black shadow-brutal-sm" type="button" aria-label="Створити нотатку" @click="createNote">+</button></div>
          <label class="mb-4 flex items-center gap-2 rounded-brutal border-2 border-ink bg-bg px-3 py-2"><span class="text-lg">⌕</span><input v-model="search" class="w-full bg-transparent text-sm outline-none placeholder:text-ink-light" placeholder="Пошук нотаток..." type="search" /></label>
          <div class="space-y-3">
            <button v-for="note in visibleNotes" :key="note.id" class="w-full rounded-brutal border-2 border-ink p-3 text-left transition hover:-translate-y-0.5" :class="activeNoteId === note.id ? 'bg-secondary-blue text-white shadow-brutal-sm' : 'bg-bg'" type="button" @click="selectNote(note)"><div class="flex items-start justify-between gap-3"><h3 class="font-black">{{ note.title }}</h3><span class="shrink-0 text-[11px] opacity-70">{{ note.updated }}</span></div><p class="mt-2 line-clamp-2 text-sm leading-5 opacity-75">{{ note.preview }}</p></button>
            <p v-if="visibleNotes.length === 0" class="rounded-brutal border-2 border-dashed border-ink p-5 text-center text-sm">Нотаток не знайдено</p>
          </div>
        </section>

        <section class="flex min-h-[620px] flex-col overflow-hidden rounded-brutal-lg border-3 border-ink bg-accent-paper shadow-brutal">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b-3 border-ink px-5 py-4"><div><p class="text-xs font-bold uppercase tracking-wider text-ink-light">Редактор</p><h2 class="text-xl font-black">{{ activeNote?.title }}</h2></div><div class="flex items-center gap-2 text-xs font-bold text-ink-light"><span class="h-2 w-2 rounded-full bg-secondary-green"></span>Збережено</div></div>
          <div class="flex flex-wrap items-center gap-1 border-b-2 border-ink bg-bg px-4 py-2"><button v-for="tool in ['B', 'I', 'U', 'H1', 'H2', '• список', '↗']" :key="tool" class="rounded-lg px-3 py-1.5 text-sm font-black transition hover:bg-primary" type="button">{{ tool }}</button></div>
          <article class="prose prose-sm max-w-none flex-1 p-6 text-ink outline-none sm:p-8" contenteditable="true" spellcheck="false" v-html="editorContent"></article>
          <div class="border-t-2 border-ink px-5 py-3 text-xs text-ink-light">Tiptap editor · Markdown підтримується</div>
        </section>
      </section>
    </div>
  </main>
</template>
