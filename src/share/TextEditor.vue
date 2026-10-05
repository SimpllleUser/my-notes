<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Node, mergeAttributes } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { TaskItem, TaskList } from '@tiptap/extension-list'

defineOptions({ name: 'TextEditor' })

const props = withDefaults(defineProps<{ content?: string; placeholder?: string }>(), {
  content: '<h1>Нова нотатка</h1><p>Почніть писати тут...</p>',
  placeholder: 'Натисніть «/», щоб додати блок, або почніть писати…',
})
const emit = defineEmits<{ 'update:content': [value: string]; update: [value: string] }>()

type SlashCommand = { name: string; description: string; icon: string; run: () => void }

const Callout = Node.create({
  name: 'callout', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { emoji: { default: '💡' }, tone: { default: 'yellow' } } },
  parseHTML() { return [{ tag: 'aside[data-type="callout"]' }] },
  renderHTML({ HTMLAttributes }) { return ['aside', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), ['span', { class: 'callout-emoji' }, HTMLAttributes.emoji], ['div', { class: 'callout-content' }, 0]] },
})

const Toggle = Node.create({
  name: 'toggle', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { title: { default: 'Розгорнути' } } },
  parseHTML() { return [{ tag: 'details[data-type="toggle"]' }] },
  renderHTML({ HTMLAttributes }) { return ['details', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }), ['summary', {}, HTMLAttributes.title], ['div', { class: 'toggle-content' }, 0]] },
})

const slashQuery = ref('')
const slashRange = ref<{ from: number; to: number } | null>(null)
const activeSlashIndex = ref(0)
const slashMenuOpen = computed(() => slashRange.value !== null)

const editor = useEditor({
  content: props.content,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: { HTMLAttributes: { class: 'notion-code-block' } },
      dropcursor: { color: '#f3c400', width: 3 },
    }),
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Callout,
    Toggle,
    Image.configure({ inline: false, allowBase64: true }),
    Underline,
    Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: ({ node }) => (node.type.name === 'heading' ? 'Заголовок' : props.placeholder),
      showOnlyCurrent: false,
    }),
    CharacterCount,
  ],
  onUpdate({ editor: instance }) {
    const html = instance.getHTML()
    emit('update:content', html)
    emit('update', html)
    updateSlashMenu()
  },
  onSelectionUpdate: updateSlashMenu,
})

const slashCommands = computed<SlashCommand[]>(() => [
  { name: 'Заголовок 1', description: 'Великий заголовок', icon: 'H1', run: () => setHeading(1) },
  { name: 'Заголовок 2', description: 'Середній заголовок', icon: 'H2', run: () => setHeading(2) },
  { name: 'Список задач', description: 'Задачі з чекбоксами', icon: '☑', run: toggleTaskList },
  { name: 'Маркований список', description: 'Простий список', icon: '•', run: toggleBulletList },
  { name: 'Нумерований список', description: 'Список із номерами', icon: '1.', run: toggleOrderedList },
  { name: 'Цитата', description: 'Виділена цитата', icon: '❝', run: toggleBlockquote },
  { name: 'Код', description: 'Блок коду', icon: '</>', run: toggleCodeBlock },
  { name: 'Callout', description: 'Важна думка або підказка', icon: '💡', run: insertCallout },
  { name: 'Toggle', description: 'Згортаний блок', icon: '▸', run: insertToggle },
  { name: 'Зображення', description: 'Вставити зображення за URL', icon: '▧', run: insertImage },
  { name: 'Роздільник', description: 'Горизонтальна лінія', icon: '—', run: insertDivider },
])
const visibleSlashCommands = computed(() => slashCommands.value.filter((item) => `${item.name} ${item.description}`.toLocaleLowerCase().includes(slashQuery.value.toLocaleLowerCase())))
const characterCount = computed(() => editor.value?.storage.characterCount?.characters() ?? 0)

watch(slashQuery, () => { activeSlashIndex.value = 0 })

function setHeading(level: 1 | 2 | 3) { if (editor.value) { clearSlashQuery(); editor.value.chain().focus().toggleHeading({ level }).run() } }
function toggleBulletList() { if (editor.value) { clearSlashQuery(); editor.value.chain().focus().toggleBulletList().run() } }
function toggleOrderedList() { if (editor.value) { clearSlashQuery(); editor.value.chain().focus().toggleOrderedList().run() } }
function toggleTaskList() { if (editor.value) { clearSlashQuery(); editor.value.chain().focus().toggleTaskList().run() } }
function toggleBlockquote() { if (editor.value) { clearSlashQuery(); editor.value.chain().focus().toggleBlockquote().run() } }
function toggleCodeBlock() { if (editor.value) { clearSlashQuery(); editor.value.chain().focus().toggleCodeBlock().run() } }
function insertCallout() {
  if (!editor.value) return
  clearSlashQuery()
  editor.value.chain().focus().insertContent({ type: 'callout', attrs: { emoji: '💡', tone: 'yellow' }, content: [{ type: 'paragraph' }] }).run()
}
function insertToggle() {
  if (!editor.value) return
  clearSlashQuery()
  editor.value.chain().focus().insertContent({ type: 'toggle', attrs: { title: 'Натисніть, щоб розгорнути' }, content: [{ type: 'paragraph' }] }).run()
}
function insertImage() {
  if (!editor.value) return
  const src = window.prompt('URL зображення', 'https://')
  if (!src) return
  clearSlashQuery()
  editor.value.chain().focus().setImage({ src, alt: 'Зображення' }).run()
}
function toggleHighlight() { editor.value?.chain().focus().toggleMark('highlight', { color: '#fff3a8' }).run() }
function setAlignment(alignment: 'left' | 'center' | 'right') {
  if (!editor.value) return
  const chain = editor.value.chain().focus()
  if (editor.value.isActive('heading')) chain.updateAttributes('heading', { textAlign: alignment }).run()
  else chain.updateAttributes('paragraph', { textAlign: alignment }).run()
}
function insertDivider() { if (editor.value) { clearSlashQuery(); editor.value.chain().focus().setHorizontalRule().run() } }
function setLink() {
  if (!editor.value) return
  const previous = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('Вставте URL', previous ?? 'https://')
  if (url === null) return
  if (url === '') editor.value.chain().focus().unsetLink().run()
  else editor.value.chain().focus().setLink({ href: url }).run()
}
function updateSlashMenu() {
  const instance = editor.value
  if (!instance) return
  const { from } = instance.state.selection
  const beforeCursor = instance.state.doc.textBetween(Math.max(0, from - 80), from, '\n', '\ufffc')
  const line = beforeCursor.split('\n').at(-1) ?? ''
  const match = line.match(/^\/([^\s]*)$/)
  if (!match) return clearSlashQuery()
  slashQuery.value = match[1] ?? ''
  slashRange.value = { from: from - line.length, to: from }
}
function clearSlashQuery() { slashRange.value = null; slashQuery.value = ''; activeSlashIndex.value = 0 }
function selectSlashCommand(command: SlashCommand) {
  if (!editor.value || !slashRange.value) return
  editor.value.chain().focus().deleteRange(slashRange.value).run()
  clearSlashQuery()
  command.run()
}
function handleKeydown(event: KeyboardEvent) {
  if (!slashMenuOpen.value) return
  if (event.key === 'Escape') { event.preventDefault(); clearSlashQuery() }
  if (!visibleSlashCommands.value.length) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    activeSlashIndex.value = (activeSlashIndex.value + direction + visibleSlashCommands.value.length) % visibleSlashCommands.value.length
    nextTick(() => document.querySelector('.slash-menu__item.is-selected')?.scrollIntoView({ block: 'nearest' }))
  }
  if ((event.key === 'Enter' || event.key === 'Tab') && visibleSlashCommands.value.length) {
    event.preventDefault()
    selectSlashCommand(visibleSlashCommands.value[activeSlashIndex.value] ?? visibleSlashCommands.value[0]!)
  }
}
onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="text-editor">
    <div class="text-editor__toolbar" aria-label="Панель форматування">
      <button class="text-editor__tool text-editor__tool--wide" type="button" title="Заголовок" @click="setHeading(1)">Aa⌄</button>
      <span class="text-editor__divider" />
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('bold') }" type="button" title="Жирний" @click="editor?.chain().focus().toggleBold().run()"><strong>B</strong></button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('italic') }" type="button" title="Курсив" @click="editor?.chain().focus().toggleItalic().run()"><em>I</em></button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('underline') }" type="button" title="Підкреслення" @click="editor?.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('strike') }" type="button" title="Закреслення" @click="editor?.chain().focus().toggleStrike().run()"><s>S</s></button>
      <span class="text-editor__divider" />
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('bulletList') }" type="button" title="Маркований список" @click="toggleBulletList">☷</button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('orderedList') }" type="button" title="Нумерований список" @click="toggleOrderedList">☷<small>1</small></button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('taskList') }" type="button" title="Список задач" @click="toggleTaskList">☑</button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('blockquote') }" type="button" title="Цитата" @click="toggleBlockquote">❝</button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('codeBlock') }" type="button" title="Код" @click="toggleCodeBlock">&lt;/&gt;</button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('link') }" type="button" title="Посилання" @click="setLink">↗</button>
      <button class="text-editor__tool" :class="{ 'is-active': editor?.isActive('highlight') }" type="button" title="Підсвічування" @click="toggleHighlight">▰</button>
      <button class="text-editor__tool" type="button" title="По центру" @click="setAlignment('center')">≡</button>
      <span class="text-editor__spacer" />
      <button class="text-editor__tool" type="button" title="Скасувати" :disabled="!editor?.can().undo()" @click="editor?.chain().focus().undo().run()">↶</button>
      <button class="text-editor__tool" type="button" title="Повторити" :disabled="!editor?.can().redo()" @click="editor?.chain().focus().redo().run()">↷</button>
    </div>
    <div class="text-editor__body" @keydown="handleKeydown">
      <EditorContent :editor="editor" />
      <div v-if="slashMenuOpen && visibleSlashCommands.length" class="slash-menu" role="menu">
        <p class="slash-menu__hint">Блоки · {{ visibleSlashCommands.length }}</p>
        <button v-for="(command, index) in visibleSlashCommands" :key="command.name" class="slash-menu__item" :class="{ 'is-selected': index === activeSlashIndex }" type="button" role="menuitem" :aria-selected="index === activeSlashIndex" @mouseenter="activeSlashIndex = index" @mousedown.prevent="selectSlashCommand(command)">
          <span class="slash-menu__icon">{{ command.icon }}</span><span><strong>{{ command.name }}</strong><small>{{ command.description }}</small></span>
        </button>
      </div>
    </div>
    <footer class="text-editor__footer"><span><kbd>⌘</kbd><kbd>Enter</kbd> виконати</span><span>{{ characterCount }} символів</span></footer>
  </div>
</template>

<style scoped>
.text-editor { overflow: hidden; border: 3px solid #000; border-radius: 18px; background: #fff; color: #000; box-shadow: 4px 4px 0 #000; }
.text-editor__toolbar { display: flex; min-height: 52px; align-items: center; gap: 3px; border-bottom: 3px solid #000; background: #f8f9fa; padding: 7px 10px; }
.text-editor__tool { display: grid; min-width: 32px; height: 32px; place-items: center; border: 2px solid transparent; border-radius: 8px; background: transparent; color: #000; cursor: pointer; font-size: 14px; font-weight: 800; }
.text-editor__tool:hover, .text-editor__tool.is-active { border-color: #000; background: #ffea00; }
.text-editor__tool:disabled { cursor: not-allowed; opacity: .3; }
.text-editor__tool--wide { width: 48px; font-size: 12px; }
.text-editor__tool small { margin-left: -8px; align-self: end; font-size: 9px; }
.text-editor__divider { height: 22px; width: 2px; background: #000; opacity: .2; margin: 0 5px; }
.text-editor__spacer { flex: 1; }
.text-editor__body { position: relative; min-height: 450px; padding: 34px clamp(20px, 5vw, 72px) 52px; }
.text-editor__body :deep(.ProseMirror) { min-height: 365px; outline: none; font-size: 16px; line-height: 1.75; }
.text-editor__body :deep(.ProseMirror > *) { margin: .65em 0; }
.text-editor__body :deep(.ProseMirror h1) { margin-top: 0; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.05; letter-spacing: -.04em; }
.text-editor__body :deep(.ProseMirror h2) { margin-top: 1.5em; font-size: 1.7rem; line-height: 1.15; letter-spacing: -.03em; }
.text-editor__body :deep(.ProseMirror h3) { font-size: 1.25rem; }
.text-editor__body :deep(.ProseMirror ul), .text-editor__body :deep(.ProseMirror ol) { padding-left: 1.5em; }
.text-editor__body :deep(.ProseMirror blockquote) { border-left: 4px solid #ff3366; background: #fff0f4; padding: .75rem 1rem; font-weight: 600; }
.text-editor__body :deep(.ProseMirror code) { border-radius: 5px; background: #e9e7df; padding: .15em .35em; font-size: .9em; }
.text-editor__body :deep(.ProseMirror pre) { overflow-x: auto; border: 2px solid #171717; border-radius: 10px; background: #191919; color: #f8f5eb; padding: 1rem; }
.text-editor__body :deep(.ProseMirror pre code) { background: transparent; color: inherit; }
.text-editor__body :deep(.ProseMirror hr) { border: 0; border-top: 2px solid #d8d3c4; }
.text-editor__body :deep(.ProseMirror a) { color: #1459b8; text-decoration: underline; text-decoration-thickness: 2px; }
.text-editor__body :deep(.ProseMirror mark) { border-radius: 3px; background: #fff3a8; padding: .05em .12em; }
.text-editor__body :deep(.ProseMirror img) { display: block; max-width: 100%; height: auto; border: 2px solid #171717; border-radius: 10px; box-shadow: 3px 3px 0 #171717; }
.text-editor__body :deep(.ProseMirror aside[data-type='callout']) { display: flex; gap: 12px; align-items: flex-start; border: 3px solid #000; border-radius: 12px; background: #ffea00; padding: 14px; box-shadow: 2px 2px 0 #000; }
.text-editor__body :deep(.ProseMirror .callout-emoji) { flex: 0 0 auto; font-size: 1.35rem; line-height: 1.5; }
.text-editor__body :deep(.ProseMirror .callout-content) { min-width: 0; flex: 1; }
.text-editor__body :deep(.ProseMirror details[data-type='toggle']) { border: 2px solid #d8d3c4; border-radius: 10px; padding: 0 13px; }
.text-editor__body :deep(.ProseMirror details[data-type='toggle'] summary) { cursor: pointer; padding: 10px 0; font-weight: 800; }
.text-editor__body :deep(.ProseMirror .toggle-content) { padding-bottom: 8px; }
.text-editor__body :deep(.ProseMirror ul[data-type='taskList']) { padding: 0; list-style: none; }
.text-editor__body :deep(.ProseMirror li[data-type='taskItem']) { display: flex; gap: .6rem; align-items: flex-start; }
.text-editor__body :deep(.ProseMirror li[data-type='taskItem'] > label) { margin-top: .45rem; }
.text-editor__body :deep(.ProseMirror li[data-type='taskItem'] > div) { flex: 1; }
.text-editor__body :deep(.ProseMirror input[type='checkbox']) { accent-color: #171717; width: 16px; height: 16px; }
.text-editor__body :deep(.ProseMirror p.is-editor-empty:first-child::before), .text-editor__body :deep(.ProseMirror p.is-empty::before) { float: left; height: 0; color: #9b978b; content: attr(data-placeholder); pointer-events: none; }
.text-editor__footer { display: flex; justify-content: space-between; border-top: 2px solid #000; color: #333; font-size: 11px; padding: 9px 16px; }
.text-editor__footer kbd { border: 1px solid #000; border-radius: 4px; background: #f8f9fa; padding: 1px 4px; margin-right: 2px; }
.slash-menu { position: absolute; z-index: 10; top: 98px; left: clamp(20px, 5vw, 72px); width: min(310px, calc(100% - 40px)); max-height: min(390px, 60vh); overflow-y: auto; border: 3px solid #000; border-radius: 12px; background: #fff; box-shadow: 4px 4px 0 #000; padding: 6px; }
.slash-menu__hint { margin: 4px 8px 5px; color: #858174; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
.slash-menu__item { display: flex; width: 100%; align-items: center; gap: 10px; border: 0; border-radius: 8px; background: transparent; padding: 8px; text-align: left; cursor: pointer; }
.slash-menu__item:hover, .slash-menu__item.is-selected { background: #ffea00; }
.slash-menu__item strong, .slash-menu__item small { display: block; }
.slash-menu__item small { color: #858174; font-size: 11px; }
.slash-menu__icon { display: grid; width: 31px; height: 31px; place-items: center; border: 2px solid #000; border-radius: 6px; background: #f8f9fa; font-size: 11px; font-weight: 900; }
@media (max-width: 640px) { .text-editor__toolbar { flex-wrap: wrap; } .text-editor__body { padding: 25px 18px 42px; } }
</style>
