import type { Content } from '@tiptap/vue-3'
import { computed, ref } from 'vue'
import type { Note } from '@/entities/note'

type UIKitFolder = {
  id: number
  name: string
  color: string
  count: number
  icon: string
}

export function useUIKit() {
  const folders = ref<UIKitFolder[]>([
    { id: 1, name: 'Особисте', color: 'bg-primary', count: 12, icon: 'User' },
    { id: 2, name: 'Робота', color: 'bg-secondary-blue', count: 8, icon: 'Briefcase' },
    { id: 3, name: 'Навчання', color: 'bg-primary-yellow', count: 5, icon: 'BookOpen' },
    { id: 4, name: 'Ідеї', color: 'bg-secondary-green', count: 9, icon: 'Lightbulb' },
  ])

  const notes = ref<Note[]>([
    {
      id: 1,
      title: 'План на тиждень',
      preview: 'Сфокусуватися на головних задачах та залишити час для відпочинку.',
      updated: 'Сьогодні, 10:42',
      folderId: 1,
    },
    {
      id: 2,
      title: 'Книги, які хочу прочитати',
      preview: 'Зібрати список рекомендацій і вибрати наступну книгу.',
      updated: 'Вчора',
      folderId: 1,
    },
    {
      id: 3,
      title: 'Нотатки з конференції',
      preview: 'Дизайн має допомагати користувачу приймати рішення.',
      updated: '12 жовтня',
      folderId: 1,
    },
    {
      id: 4,
      title: 'Результати зустрічі',
      preview: 'Наступні кроки для команди та домовленості по релізу.',
      updated: '10 жовтня',
      folderId: 2,
    },
    {
      id: 5,
      title: 'Курс з типографіки',
      preview: 'Основні принципи ритму, контрасту та ієрархії.',
      updated: '8 жовтня',
      folderId: 3,
    },
  ])

  const activeFolderId = ref(1)
  const activeNoteId = ref(1)
  const search = ref('')
  const editorContent = ref<Content>(
    '<h1>План на тиждень</h1><p>Невеликий план допомагає зберігати фокус і не перевантажувати себе.</p><h2>Головні задачі</h2><ul><li>Завершити дизайн головного екрану</li><li>Підготувати нотатки до зустрічі</li><li>Залишити вечір для відпочинку</li></ul>',
  )

  const activeFolder = computed(() =>
    folders.value.find((folder) => folder.id === activeFolderId.value),
  )
  const activeNote = computed(() => notes.value.find((note) => note.id === activeNoteId.value))
  const visibleNotes = computed(() =>
    notes.value.filter(
      (note) =>
        note.folderId === activeFolderId.value &&
        `${note.title} ${note.preview}`.toLowerCase().includes(search.value.toLowerCase()),
    ),
  )

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
    const newNote: Note = {
      id: Date.now(),
      title: 'Нова нотатка',
      preview: 'Почніть писати тут...',
      updated: 'Щойно',
      folderId: activeFolderId.value,
    }
    notes.value.unshift(newNote)
    activeNoteId.value = newNote.id
    editorContent.value = '<h1>Нова нотатка</h1><p>Почніть писати тут...</p>'
  }

  function addFolder(payload: { name: string; icon: string; color: string }) {
    const newFolder: UIKitFolder = {
      id: Date.now(),
      name: payload.name,
      icon: payload.icon,
      color: payload.color,
      count: 0,
    }
    folders.value.push(newFolder)
  }

  return {
    folders,
    notes,
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
  }
}
