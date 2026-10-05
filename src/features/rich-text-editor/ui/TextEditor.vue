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
import { Markdown } from '@tiptap/markdown'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'

defineOptions({ name: 'TextEditor' })

const props = withDefaults(defineProps<{ content?: string; placeholder?: string }>(), {
  content: '<h1>Нова нотатка</h1><p>Почніть писати тут...</p>',
  placeholder: 'Натисніть «/», щоб додати блок, або почніть писати…',
})
const emit = defineEmits<{ 'update:content': [value: string]; update: [value: string] }>()

type SlashCommand = { name: string; description: string; icon: string; keywords?: string; run: () => void }

const Callout = Node.create({
  name: 'callout', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { emoji: { default: '💡' }, tone: { default: 'yellow' } } },
  parseHTML() { return [{ tag: 'aside[data-type="callout"]' }] },
  renderHTML({ HTMLAttributes }) { return ['aside', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), ['span', { class: 'callout-emoji' }, HTMLAttributes.emoji], ['div', { class: 'callout-content' }, 0]] },
})

const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      title: {
        default: 'Toggle',
        parseHTML: (element) => element.getAttribute('data-title') ?? element.querySelector('summary')?.textContent ?? 'Toggle',
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
      open: {
        default: true,
        parseHTML: (element) => (element.hasAttribute('data-open') ? element.getAttribute('data-open') !== 'false' : element.hasAttribute('open')),
        renderHTML: (attrs) => ({ 'data-open': attrs.open ? 'true' : 'false' }),
      },
    }
  },
  parseHTML() {
    const contentElement = (element: HTMLElement) => (element.querySelector<HTMLElement>(':scope > .toggle-content') ?? element)
    return [
      { tag: 'div[data-type="toggle"]', contentElement },
      { tag: 'details[data-type="toggle"]', contentElement },
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }),
      [
        'div',
        { class: 'toggle-header' },
        ['span', { class: 'toggle-caret', 'aria-hidden': 'true' }, node.attrs.open ? '▾' : '▸'],
        ['span', { class: 'toggle-title' }, node.attrs.title || 'Toggle'],
      ],
      ['div', { class: 'toggle-content' }, 0],
    ]
  },
  // A native <details>/<summary> doesn't reliably toggle when nested inside a
  // contenteditable region (clicks get swallowed by ProseMirror's selection
  // handling), and it always starts collapsed, hiding newly inserted content.
  // A node view with a plain div + manually managed `open` attr avoids both.
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div')
      const header = document.createElement('div')
      const caret = document.createElement('button')
      const titleInput = document.createElement('input')
      const content = document.createElement('div')

      dom.className = 'toggle-block'
      header.className = 'toggle-header'
      header.contentEditable = 'false'
      caret.type = 'button'
      caret.className = 'toggle-caret'
      caret.setAttribute('aria-label', 'Згорнути або розгорнути блок')
      titleInput.type = 'text'
      titleInput.className = 'toggle-title'
      titleInput.placeholder = 'Toggle'
      content.className = 'toggle-content'

      const applyAttrs = (currentNode: typeof node) => {
        dom.dataset.open = String(currentNode.attrs.open)
        caret.textContent = currentNode.attrs.open ? '▾' : '▸'
        content.style.display = currentNode.attrs.open ? '' : 'none'
        if (document.activeElement !== titleInput && titleInput.value !== currentNode.attrs.title) {
          titleInput.value = currentNode.attrs.title
        }
      }

      const setAttrs = (partial: Record<string, unknown>) => {
        if (typeof getPos !== 'function') return
        const pos = getPos()
        if (typeof pos !== 'number') return
        const liveNode = editor.state.doc.nodeAt(pos)
        if (!liveNode) return
        editor.view.dispatch(editor.view.state.tr.setNodeMarkup(pos, undefined, { ...liveNode.attrs, ...partial }))
      }

      caret.addEventListener('mousedown', (event) => event.preventDefault())
      caret.addEventListener('click', () => {
        if (typeof getPos !== 'function') return
        const pos = getPos()
        if (typeof pos !== 'number') return
        const liveNode = editor.state.doc.nodeAt(pos)
        if (!liveNode) return
        setAttrs({ open: !liveNode.attrs.open })
      })

      titleInput.addEventListener('mousedown', (event) => event.stopPropagation())
      titleInput.addEventListener('input', () => setAttrs({ title: titleInput.value }))

      header.append(caret, titleInput)
      dom.append(header, content)
      applyAttrs(node)

      return {
        dom,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false
          applyAttrs(updatedNode)
          return true
        },
      }
    }
  },
})

function looksLikeMarkdown(value: string) {
  const basicMarkdown = /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|~~~|---\s*$)|\*\*[^*]+\*\*|__[^_]+__|\[[^\]]+\]\([^\s)]+\)/m
  const markdownTable = /\|.*\|[ \t]*\n[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*(\n|$)/m
  return basicMarkdown.test(value) || markdownTable.test(value)
}

const slashQuery = ref('')
const slashRange = ref<{ from: number; to: number } | null>(null)
const activeSlashIndex = ref(0)
const slashMenuOpen = computed(() => slashRange.value !== null)

function pasteMarkdown(event: ClipboardEvent) {
  const instance = editor.value
  const markdown = event.clipboardData?.getData('text/plain') ?? ''
  const html = event.clipboardData?.getData('text/html') ?? ''
  if (!instance?.markdown || !markdown || (html && !looksLikeMarkdown(markdown))) return false
  event.preventDefault()
  event.stopPropagation()
  const parsed = instance.markdown.parse(markdown)
  instance.commands.insertContent(parsed.type === 'doc' ? (parsed.content ?? []) : parsed)
  return true
}

const editor = useEditor({
  content: props.content,
  editorProps: {
    handlePaste(_view, event) {
      return pasteMarkdown(event)
    },
  },
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
    Image.configure({ inline: true, allowBase64: true }),
    Markdown.configure({ markedOptions: { gfm: true, breaks: false } }),
    Underline,
    Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: true, lastColumnResizable: true } }),
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
  { name: 'Заголовок 1', description: 'Великий заголовок', icon: 'H1', keywords: 'heading title h1', run: () => setHeading(1) },
  { name: 'Заголовок 2', description: 'Середній заголовок', icon: 'H2', keywords: 'heading title h2', run: () => setHeading(2) },
  { name: 'Список задач', description: 'Задачі з чекбоксами', icon: '☑', keywords: 'task list todo checkbox', run: toggleTaskList },
  { name: 'Маркований список', description: 'Простий список', icon: '•', keywords: 'bullet list', run: toggleBulletList },
  { name: 'Нумерований список', description: 'Список із номерами', icon: '1.', keywords: 'numbered ordered list', run: toggleOrderedList },
  { name: 'Цитата', description: 'Виділена цитата', icon: '❝', keywords: 'quote blockquote', run: toggleBlockquote },
  { name: 'Код', description: 'Блок коду', icon: '</>', keywords: 'code block', run: toggleCodeBlock },
  { name: 'Callout', description: 'Важна думка або підказка', icon: '💡', keywords: 'callout note tip', run: insertCallout },
  { name: 'Toggle', description: 'Згортаний блок', icon: '▸', keywords: 'toggle collapse details', run: insertToggle },
  { name: 'Зображення', description: 'Вставити зображення за URL', icon: '▧', keywords: 'image picture photo', run: openImagePopover },
  { name: 'Таблиця', description: 'Таблиця 3×3 з заголовком', icon: '▦', keywords: 'table', run: insertTable },
  { name: 'Роздільник', description: 'Горизонтальна лінія', icon: '—', keywords: 'divider separator horizontal rule hr', run: insertDivider },
])
const visibleSlashCommands = computed(() => {
  const query = slashQuery.value.toLocaleLowerCase()
  return slashCommands.value.filter((item) => `${item.name} ${item.description} ${item.keywords ?? ''}`.toLocaleLowerCase().includes(query))
})
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
  editor.value.chain().focus().insertContent({ type: 'toggle', content: [{ type: 'paragraph' }] }).run()
}
const imagePopoverOpen = ref(false)
const imageUrl = ref('')
const imageAlt = ref('')
const imageUrlInput = ref<HTMLInputElement | null>(null)
const imagePopoverRoot = ref<HTMLElement | null>(null)

function openImagePopover() {
  clearSlashQuery()
  imageUrl.value = ''
  imageAlt.value = ''
  imagePopoverOpen.value = true
  nextTick(() => imageUrlInput.value?.focus())
}
function closeImagePopover() {
  imagePopoverOpen.value = false
}
function confirmImage() {
  const src = imageUrl.value.trim()
  if (!src || !editor.value) return
  editor.value.chain().focus().setImage({ src, alt: imageAlt.value.trim() || 'Зображення' }).run()
  closeImagePopover()
}
function handleImagePopoverClickOutside(event: MouseEvent) {
  if (imagePopoverOpen.value && imagePopoverRoot.value && !imagePopoverRoot.value.contains(event.target as globalThis.Node)) {
    closeImagePopover()
  }
}
watch(imagePopoverOpen, (isOpen) => {
  if (isOpen) document.addEventListener('mousedown', handleImagePopoverClickOutside)
  else document.removeEventListener('mousedown', handleImagePopoverClickOutside)
})
function toggleHighlight() { editor.value?.chain().focus().toggleMark('highlight', { color: '#fff3a8' }).run() }
function setAlignment(alignment: 'left' | 'center' | 'right') {
  if (!editor.value) return
  const chain = editor.value.chain().focus()
  if (editor.value.isActive('heading')) chain.updateAttributes('heading', { textAlign: alignment }).run()
  else chain.updateAttributes('paragraph', { textAlign: alignment }).run()
}
function insertDivider() { if (editor.value) { clearSlashQuery(); editor.value.chain().focus().setHorizontalRule().run() } }
function insertTable() {
  if (!editor.value) return
  clearSlashQuery()
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}
function addRowAfter() { editor.value?.chain().focus().addRowAfter().run() }
function addColumnAfter() { editor.value?.chain().focus().addColumnAfter().run() }
function deleteRow() { editor.value?.chain().focus().deleteRow().run() }
function deleteColumn() { editor.value?.chain().focus().deleteColumn().run() }
function deleteTable() { editor.value?.chain().focus().deleteTable().run() }
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
function handlePaste(event: ClipboardEvent) {
  pasteMarkdown(event)
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
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleImagePopoverClickOutside)
  editor.value?.destroy()
})
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
      <div ref="imagePopoverRoot" class="text-editor__popover-anchor">
        <button class="text-editor__tool" :class="{ 'is-active': imagePopoverOpen }" type="button" title="Зображення" @click="imagePopoverOpen ? closeImagePopover() : openImagePopover()">▧</button>
        <div v-if="imagePopoverOpen" class="image-popover" role="dialog" aria-label="Вставити зображення">
          <p class="image-popover__title">Зображення за посиланням</p>
          <input
            ref="imageUrlInput"
            v-model="imageUrl"
            type="url"
            class="image-popover__field"
            placeholder="https://..."
            @keydown.enter.prevent="confirmImage"
            @keydown.escape.prevent="closeImagePopover"
          />
          <input
            v-model="imageAlt"
            type="text"
            class="image-popover__field"
            placeholder="Опис зображення (необовʼязково)"
            @keydown.enter.prevent="confirmImage"
            @keydown.escape.prevent="closeImagePopover"
          />
          <div class="image-popover__actions">
            <button class="image-popover__btn" type="button" @click="closeImagePopover">Скасувати</button>
            <button class="image-popover__btn image-popover__btn--primary" type="button" :disabled="!imageUrl.trim()" @click="confirmImage">Вставити</button>
          </div>
        </div>
      </div>
      <button class="text-editor__tool" type="button" title="Вставити таблицю" @click="insertTable">▦</button>
      <template v-if="editor?.isActive('table')">
        <span class="text-editor__divider" />
        <button class="text-editor__tool" type="button" title="Додати рядок" @click="addRowAfter">+▭</button>
        <button class="text-editor__tool" type="button" title="Додати колонку" @click="addColumnAfter">▯+</button>
        <button class="text-editor__tool" type="button" title="Видалити рядок" @click="deleteRow">▭−</button>
        <button class="text-editor__tool" type="button" title="Видалити колонку" @click="deleteColumn">▯−</button>
        <button class="text-editor__tool" type="button" title="Видалити таблицю" @click="deleteTable">✕▦</button>
      </template>
      <span class="text-editor__spacer" />
      <button class="text-editor__tool" type="button" title="Скасувати" :disabled="!editor?.can().undo()" @click="editor?.chain().focus().undo().run()">↶</button>
      <button class="text-editor__tool" type="button" title="Повторити" :disabled="!editor?.can().redo()" @click="editor?.chain().focus().redo().run()">↷</button>
    </div>
    <div class="text-editor__body" @keydown.capture="handleKeydown" @paste.capture="handlePaste">
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
.text-editor { overflow: hidden; border: 3px solid var(--color-ink); border-radius: 18px; background: var(--color-accent-paper); color: var(--color-ink); box-shadow: 4px 4px 0 var(--color-ink); }
.text-editor__toolbar { display: flex; min-height: 52px; align-items: center; gap: 3px; border-bottom: 3px solid var(--color-ink); background: var(--color-bg); padding: 7px 10px; }
.text-editor__tool { display: grid; min-width: 32px; height: 32px; place-items: center; border: 2px solid transparent; border-radius: 8px; background: transparent; color: var(--color-ink); cursor: pointer; font-size: 14px; font-weight: 800; }
.text-editor__tool:hover, .text-editor__tool.is-active { border-color: var(--color-ink); background: var(--color-primary-yellow); color: #171717; }
.text-editor__tool:disabled { cursor: not-allowed; opacity: .3; }
.text-editor__tool--wide { width: 48px; font-size: 12px; }
.text-editor__tool small { margin-left: -8px; align-self: end; font-size: 9px; }
.text-editor__divider { height: 22px; width: 2px; background: var(--color-ink); opacity: .2; margin: 0 5px; }
.text-editor__spacer { flex: 1; }
.text-editor__popover-anchor { position: relative; display: inline-flex; }
.image-popover { position: absolute; z-index: 20; top: calc(100% + 8px); left: 0; width: min(300px, calc(100vw - 40px)); border: 3px solid var(--color-ink); border-radius: 12px; background: var(--color-accent-paper); padding: 14px; box-shadow: 4px 4px 0 var(--color-ink); }
.image-popover__title { margin: 0 0 9px; color: var(--color-ink-light); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; }
.image-popover__field { display: block; width: 100%; border: 2px solid var(--color-ink); border-radius: 8px; background: var(--color-bg); color: var(--color-ink); padding: 8px 10px; font-size: 14px; }
.image-popover__field + .image-popover__field { margin-top: 8px; }
.image-popover__field:focus { outline: none; background: var(--color-accent-paper); box-shadow: 0 0 0 2px var(--color-primary-yellow) inset; }
.image-popover__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.image-popover__btn { border: 2px solid var(--color-ink); border-radius: 8px; background: var(--color-accent-paper); color: var(--color-ink); padding: 6px 14px; font-size: 13px; font-weight: 800; cursor: pointer; }
.image-popover__btn:hover { transform: translateY(-1px); }
.image-popover__btn--primary { background: var(--color-primary-yellow); color: #171717; }
.image-popover__btn--primary:disabled { cursor: not-allowed; opacity: .4; transform: none; }
.text-editor__body { position: relative; min-height: 450px; padding: 34px clamp(20px, 5vw, 72px) 52px; }
.text-editor__body :deep(.ProseMirror) { min-height: 365px; outline: none; font-size: 16px; line-height: 1.75; }
.text-editor__body :deep(.ProseMirror > *) { margin: .65em 0; }
.text-editor__body :deep(.ProseMirror h1) { margin-top: 0; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.05; letter-spacing: -.04em; }
.text-editor__body :deep(.ProseMirror h2) { margin-top: 1.5em; font-size: 1.7rem; line-height: 1.15; letter-spacing: -.03em; }
.text-editor__body :deep(.ProseMirror h3) { font-size: 1.25rem; }
.text-editor__body :deep(.ProseMirror ul), .text-editor__body :deep(.ProseMirror ol) { padding-left: 1.4em; }
.text-editor__body :deep(.ProseMirror ul) { list-style: disc outside; }
.text-editor__body :deep(.ProseMirror ol) { list-style: decimal outside; }
.text-editor__body :deep(.ProseMirror ul ul) { list-style-type: circle; }
.text-editor__body :deep(.ProseMirror ul ul ul) { list-style-type: square; }
.text-editor__body :deep(.ProseMirror ol ol) { list-style-type: lower-alpha; }
.text-editor__body :deep(.ProseMirror ol ol ol) { list-style-type: lower-roman; }
.text-editor__body :deep(.ProseMirror li) { margin: .2em 0; padding-left: .2em; }
.text-editor__body :deep(.ProseMirror li::marker) { font-weight: 700; }
.text-editor__body :deep(.ProseMirror li > ul), .text-editor__body :deep(.ProseMirror li > ol) { margin-top: .2em; }
.text-editor__body :deep(.ProseMirror blockquote) { border-left: 4px solid var(--color-primary); background: color-mix(in srgb, var(--color-primary) 10%, var(--color-accent-paper)); padding: .75rem 1rem; font-weight: 600; }
.text-editor__body :deep(.ProseMirror code) { border-radius: 5px; background: color-mix(in srgb, var(--color-ink) 12%, var(--color-accent-paper)); padding: .15em .35em; font-size: .9em; }
.text-editor__body :deep(.ProseMirror pre) { overflow-x: auto; border: 2px solid var(--color-ink); border-radius: 10px; background: var(--color-code-bg); color: var(--color-code-ink); padding: 1rem; }
.text-editor__body :deep(.ProseMirror pre code) { background: transparent; color: inherit; }
.text-editor__body :deep(.ProseMirror hr) { border: 0; border-top: 2px solid color-mix(in srgb, var(--color-ink) 30%, transparent); }
.text-editor__body :deep(.ProseMirror a) { color: var(--color-secondary-blue); text-decoration: underline; text-decoration-thickness: 2px; }
.text-editor__body :deep(.ProseMirror mark) { border-radius: 3px; background: color-mix(in srgb, var(--color-primary-yellow) 55%, var(--color-accent-paper)); color: #171717; padding: .05em .12em; }
.text-editor__body :deep(.ProseMirror img) { display: block; max-width: 100%; height: auto; border: 2px solid var(--color-ink); border-radius: 10px; box-shadow: 3px 3px 0 var(--color-ink); }
.text-editor__body :deep(.ProseMirror aside[data-type='callout']) { display: flex; gap: 12px; align-items: flex-start; border: 3px solid var(--color-ink); border-radius: 12px; background: var(--color-primary-yellow); color: #171717; padding: 14px; box-shadow: 2px 2px 0 var(--color-ink); }
.text-editor__body :deep(.ProseMirror .callout-emoji) { flex: 0 0 auto; font-size: 1.35rem; line-height: 1.5; }
.text-editor__body :deep(.ProseMirror .callout-content) { min-width: 0; flex: 1; }
.text-editor__body :deep(.ProseMirror .toggle-block) { border: 2px solid color-mix(in srgb, var(--color-ink) 30%, transparent); border-radius: 10px; padding: 2px 13px; }
.text-editor__body :deep(.ProseMirror .toggle-header) { display: flex; align-items: center; gap: 8px; padding: 10px 0; }
.text-editor__body :deep(.ProseMirror .toggle-caret) { display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 6px; background: transparent; color: inherit; cursor: pointer; font-size: 12px; }
.text-editor__body :deep(.ProseMirror .toggle-caret:hover) { background: var(--color-bg); }
.text-editor__body :deep(.ProseMirror .toggle-title) { flex: 1; border: 0; background: transparent; padding: 0; font-family: inherit; font-size: inherit; font-weight: 800; color: inherit; outline: none; }
.text-editor__body :deep(.ProseMirror .toggle-title::placeholder) { color: var(--color-ink-light); font-weight: 800; }
.text-editor__body :deep(.ProseMirror .toggle-content) { padding: 0 0 10px 30px; }
.text-editor__body :deep(.ProseMirror ul[data-type='taskList']) { padding: 0; list-style: none; }
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li) { display: flex; gap: .6rem; align-items: flex-start; margin: .35em 0; }
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > label) { display: flex; margin-top: .25rem; user-select: none; }
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > div) { min-width: 0; flex: 1; }
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > div p) { margin: 0; }
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li[data-checked='true'] > div) { color: var(--color-ink-light); text-decoration: line-through; }
.text-editor__body :deep(.ProseMirror input[type='checkbox']) { accent-color: var(--color-ink); width: 16px; height: 16px; cursor: pointer; }
.text-editor__body :deep(.ProseMirror .tableWrapper) { margin: 1em 0; overflow-x: auto; }
.text-editor__body :deep(.ProseMirror table) { border-collapse: collapse; table-layout: fixed; width: 100%; border: 2px solid var(--color-ink); border-radius: 10px; overflow: hidden; }
.text-editor__body :deep(.ProseMirror td), .text-editor__body :deep(.ProseMirror th) { position: relative; box-sizing: border-box; min-width: 90px; border: 1px solid var(--color-ink); padding: .5em .7em; vertical-align: top; }
.text-editor__body :deep(.ProseMirror td > *), .text-editor__body :deep(.ProseMirror th > *) { margin: 0; }
.text-editor__body :deep(.ProseMirror th) { background: var(--color-primary-yellow); color: #171717; font-weight: 800; text-align: left; }
.text-editor__body :deep(.ProseMirror .column-resize-handle) { position: absolute; top: 0; bottom: -2px; right: -2px; width: 4px; background: var(--color-ink); pointer-events: none; }
.text-editor__body :deep(.ProseMirror.resize-cursor) { cursor: col-resize; }
.text-editor__body :deep(.ProseMirror .selectedCell) { background: color-mix(in srgb, var(--color-primary-yellow) 35%, transparent); }
.text-editor__body :deep(.ProseMirror p.is-editor-empty:first-child::before), .text-editor__body :deep(.ProseMirror p.is-empty::before) { float: left; height: 0; color: var(--color-ink-light); content: attr(data-placeholder); pointer-events: none; }
.text-editor__footer { display: flex; justify-content: space-between; border-top: 2px solid var(--color-ink); color: var(--color-ink-light); font-size: 11px; padding: 9px 16px; }
.text-editor__footer kbd { border: 1px solid var(--color-ink); border-radius: 4px; background: var(--color-bg); padding: 1px 4px; margin-right: 2px; }
.slash-menu { position: absolute; z-index: 10; top: 98px; left: clamp(20px, 5vw, 72px); width: min(310px, calc(100% - 40px)); max-height: min(390px, 60vh); overflow-y: auto; border: 3px solid var(--color-ink); border-radius: 12px; background: var(--color-accent-paper); box-shadow: 4px 4px 0 var(--color-ink); padding: 6px; }
.slash-menu__hint { margin: 4px 8px 5px; color: var(--color-ink-light); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
.slash-menu__item { display: flex; width: 100%; align-items: center; gap: 10px; border: 0; border-radius: 8px; background: transparent; color: var(--color-ink); padding: 8px; text-align: left; cursor: pointer; }
.slash-menu__item:hover, .slash-menu__item.is-selected { background: var(--color-primary-yellow); color: #171717; }
.slash-menu__item strong, .slash-menu__item small { display: block; }
.slash-menu__item small { color: var(--color-ink-light); font-size: 11px; }
.slash-menu__item:hover small, .slash-menu__item.is-selected small { color: #171717; opacity: .7; }
.slash-menu__icon { display: grid; width: 31px; height: 31px; place-items: center; border: 2px solid var(--color-ink); border-radius: 6px; background: var(--color-bg); color: var(--color-ink); font-size: 11px; font-weight: 900; }
@media (max-width: 640px) { .text-editor__toolbar { flex-wrap: wrap; } .text-editor__body { padding: 25px 18px 42px; } }
</style>
