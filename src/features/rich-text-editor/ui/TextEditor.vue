<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type Component } from 'vue'
import { EditorContent, useEditor, type Content, type JSONContent } from '@tiptap/vue-3'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Code,
  Copy,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Link,
  List,
  ListChecks,
  ListOrdered,
  MoreHorizontal,
  Plus,
  Quote,
  Redo2,
  RemoveFormatting,
  Trash2,
  Type,
  Undo2,
  X,
} from '@lucide/vue'
import { createExtensions } from '../model/extensions'
import { pasteMarkdown } from '../model/markdown'
import { createSlashCommands } from '../model/slashCommands'
import { useBlockHandles } from '../model/useBlockHandles'
import { useEditorActions } from '../model/useEditorActions'
import { useImagePopover } from '../model/useImagePopover'
import { useOverlayPosition } from '../model/useOverlayPosition'
import { useSlashMenu } from '../model/useSlashMenu'

defineOptions({ name: 'TextEditor' })

const props = withDefaults(defineProps<{ content?: Content; placeholder?: string }>(), {
  content: '<h1>Нова нотатка</h1><p>Почніть писати тут...</p>',
  placeholder: 'Напишіть щось або натисніть «/», щоб додати блок…',
})
const emit = defineEmits<{ 'update:content': [value: JSONContent]; update: [value: JSONContent] }>()

const bodyRef = ref<HTMLElement | null>(null)
const bubbleRoot = ref<HTMLElement | null>(null)
const slashMenuRef = ref<HTMLElement | null>(null)
const styleMenuOpen = ref(false)
const moreMenuOpen = ref(false)

const editor = useEditor({
  content: props.content,
  extensions: createExtensions(() => props.placeholder),
  onUpdate({ editor: instance }) {
    const json = instance.getJSON()
    json.content.forEach((item, index) => {
      item.attrs = {
        ...item.attrs,
        order: index,
      }
    })

    emit('update:content', json)
    emit('update', json)
    console.log(json)
    slashMenu.syncWithSelection()
    overlay.update()
  },
  onSelectionUpdate() {
    slashMenu.syncWithSelection()
    overlay.update()
  },
})

// The slash menu reads its commands lazily, which breaks the cycle
// slashMenu -> slashCommands -> actions -> slashMenu.close.
const slashMenu = useSlashMenu(editor, () => slashCommands)
const actions = useEditorActions(editor, slashMenu.close)
const imagePopover = useImagePopover(editor, slashMenu.close)
const slashCommands = createSlashCommands(actions, imagePopover.open)
const overlay = useOverlayPosition(editor)

const {
  gutter: blockGutter,
  menu: blockMenu,
  dropLine,
  gutterEl,
  menuEl,
  onMousemove,
  onMouseleave,
  addBlock,
  openMenu: openBlockMenu,
  closeMenu: closeBlockMenu,
  hideGutter,
  duplicateBlock,
  deleteBlock,
  onDragstart,
  onDragover,
  onDrop,
  onDragend,
} = useBlockHandles(editor, bodyRef, () => slashMenu.openManual())

const characterCount = computed(() => editor.value?.storage.characterCount?.characters() ?? 0)
const linkHref = computed(
  () => (editor.value?.getAttributes('link').href as string | undefined) ?? '',
)
const linkActive = computed(() => !!editor.value?.isActive('link'))

// ——— Плаваючий bubble-тулбар: з'являється над виділенням (як у Notion) ———
const bubbleBox = computed(() => {
  if (blockMenu.value || slashMenu.isShown.value || imagePopover.isOpen.value) return null
  const selected = overlay.selection.value
  if (selected) return selected
  if (linkActive.value && overlay.caret.value) {
    const { top, left } = overlay.caret.value
    return { top, bottom: top, left }
  }
  return null
})

const bubbleStyle = computed(() => {
  const box = bubbleBox.value
  if (!box) return { display: 'none' }
  const above = box.top - 48 >= 8
  return {
    top: `${above ? box.top - 48 : box.bottom + 8}px`,
    left: `${box.left}px`,
  }
})

const menuBelow = computed(() => {
  const box = bubbleBox.value
  return !box || box.bottom < window.innerHeight * 0.62
})

const turnIntoItems: { label: string; icon: Component; run: () => void }[] = [
  { label: 'Звичайний текст', icon: Type, run: () => actions.setText() },
  { label: 'Заголовок 1', icon: Heading1, run: () => actions.setHeading(1) },
  { label: 'Заголовок 2', icon: Heading2, run: () => actions.setHeading(2) },
  { label: 'Заголовок 3', icon: Heading3, run: () => actions.setHeading(3) },
  { label: 'Маркований список', icon: List, run: () => actions.toggleBulletList() },
  { label: 'Нумерований список', icon: ListOrdered, run: () => actions.toggleOrderedList() },
  { label: 'Список задач', icon: ListChecks, run: () => actions.toggleTaskList() },
  { label: 'Цитата', icon: Quote, run: () => actions.toggleBlockquote() },
  { label: 'Код', icon: Code, run: () => actions.toggleCodeBlock() },
]

const highlightColors = [
  { label: 'Жовтий', color: '#fff3a8' },
  { label: 'Червоний', color: '#ffd3d6' },
  { label: 'Синій', color: '#c8dcff' },
  { label: 'Зелений', color: '#cdeecb' },
  { label: 'Фіолетовий', color: '#e3d3fc' },
]

function applyTurnInto(run: () => void) {
  styleMenuOpen.value = false
  closeBlockMenu()
  hideGutter()
  run()
}

function toggleStyleMenu() {
  styleMenuOpen.value = !styleMenuOpen.value
  moreMenuOpen.value = false
}

function toggleMoreMenu() {
  moreMenuOpen.value = !moreMenuOpen.value
  styleMenuOpen.value = false
}

function runMore(run: () => void) {
  moreMenuOpen.value = false
  run()
}

function pickHighlight(color: string) {
  moreMenuOpen.value = false
  actions.setHighlightColor(color || null)
}

function toggleCodeMark() {
  editor.value?.chain().focus().toggleCode().run()
}

function openLink() {
  if (linkHref.value) window.open(linkHref.value, '_blank', 'noopener,noreferrer')
}

function copyLink() {
  if (linkHref.value) void navigator.clipboard.writeText(linkHref.value)
}

function removeLink() {
  actions.unsetLink()
}

// ——— Позиції плаваючих елементів (viewport-координати) ———
const slashStyle = computed(() => {
  const point = overlay.caret.value
  if (!point) return { display: 'none' }
  const menuWidth = 320
  const menuHeight = 340
  const left = Math.max(8, Math.min(point.left, window.innerWidth - menuWidth - 8))
  const belowTop = point.top + 8
  const top =
    belowTop + menuHeight > window.innerHeight - 8
      ? Math.max(8, point.top - menuHeight - 8)
      : belowTop
  return { top: top + 'px', left: left + 'px' }
})

const popoverStyle = computed(() => {
  const point = overlay.caret.value
  if (!point) return { display: 'none' }
  const left = Math.max(8, Math.min(point.left, window.innerWidth - 312))
  const top = Math.max(8, Math.min(point.top + 8, window.innerHeight - 250))
  return { top: top + 'px', left: left + 'px' }
})

const blockMenuStyle = computed(() => {
  const position = blockMenu.value
  if (!position) return { display: 'none' }
  return { top: position.top + 'px', left: position.left + 'px' }
})

const gutterStyle = computed(() => ({
  top: (blockGutter.value?.top ?? 0) + 'px',
  left: (blockGutter.value?.left ?? 0) - 20 + 'px',
}))

const dropLineStyle = computed(() => {
  const line = dropLine.value
  if (!line) return { display: 'none' }
  return { top: line.top + 'px', left: line.left + 'px', width: line.width + 'px' }
})

// ——— Закриття меню ———
function handleKeydown(event: KeyboardEvent) {
  slashMenu.handleKeydown(event)
  if (event.key === 'Escape') {
    styleMenuOpen.value = false
    moreMenuOpen.value = false
  }
}

function onBubbleOutsideMousedown(event: MouseEvent) {
  if (!bubbleRoot.value?.contains(event.target as globalThis.Node)) {
    styleMenuOpen.value = false
    moreMenuOpen.value = false
  }
}

watch([styleMenuOpen, moreMenuOpen], (states) => {
  if (states.some(Boolean)) document.addEventListener('mousedown', onBubbleOutsideMousedown)
  else document.removeEventListener('mousedown', onBubbleOutsideMousedown)
})

watch(bubbleBox, (box) => {
  if (!box) {
    styleMenuOpen.value = false
    moreMenuOpen.value = false
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onBubbleOutsideMousedown)
})

watch(slashMenu.activeIndex, () =>
  nextTick(() =>
    slashMenuRef.value?.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' }),
  ),
)

function handlePaste(event: ClipboardEvent) {
  pasteMarkdown(editor.value, event)
}
</script>

<template>
  <div class="text-editor">
    <div
      ref="bodyRef"
      class="text-editor__body"
      @keydown.capture="handleKeydown"
      @paste.capture="handlePaste"
      @mousemove="onMousemove"
      @mouseleave="onMouseleave"
      @dragover="onDragover"
      @drop="onDrop"
    >
      <EditorContent :editor="editor" />

      <div v-if="blockGutter" ref="gutterEl" class="text-editor__gutter" :style="gutterStyle">
        <button class="gutter-btn" type="button" title="Додати блок нижче" @click="addBlock">
          <Plus :size="16" />
        </button>
        <button
          class="gutter-btn"
          type="button"
          title="Меню блоку"
          draggable="true"
          @click="openBlockMenu"
          @dragstart="onDragstart"
          @dragend="onDragend"
        >
          <GripVertical :size="16" />
        </button>
      </div>

      <div v-if="dropLine" class="text-editor__drop-line" :style="dropLineStyle" />

      <div
        v-if="slashMenu.isShown.value"
        ref="slashMenuRef"
        class="notion-menu slash-menu"
        :style="slashStyle"
        role="menu"
      >
        <p class="notion-menu__label">Блоки</p>
        <button
          v-for="(command, index) in slashMenu.visibleCommands.value"
          :key="command.name"
          class="notion-menu__item"
          :class="{ 'is-selected': index === slashMenu.activeIndex.value }"
          type="button"
          role="menuitem"
          :aria-selected="index === slashMenu.activeIndex.value"
          @mouseenter="slashMenu.activeIndex.value = index"
          @mousedown.prevent="slashMenu.select(command)"
        >
          <span class="slash-menu__icon" aria-hidden="true">{{ command.icon }}</span>
          <span class="slash-menu__name">{{ command.name }}</span>
          <span class="slash-menu__desc">{{ command.description }}</span>
        </button>
      </div>

      <div
        v-if="blockMenu"
        ref="menuEl"
        class="notion-menu block-menu"
        :style="blockMenuStyle"
        role="menu"
      >
        <p class="notion-menu__label">Перетворити на</p>
        <button
          v-for="item in turnIntoItems"
          :key="item.label"
          class="notion-menu__item"
          type="button"
          @mousedown.prevent="applyTurnInto(item.run)"
        >
          <component :is="item.icon" :size="16" class="notion-menu__glyph" />
          <span>{{ item.label }}</span>
        </button>
        <span class="notion-menu__divider" />
        <button class="notion-menu__item" type="button" @mousedown.prevent="duplicateBlock">
          <Copy :size="16" class="notion-menu__glyph" />
          <span>Дублювати</span>
        </button>
        <button
          class="notion-menu__item notion-menu__item--danger"
          type="button"
          @mousedown.prevent="deleteBlock"
        >
          <Trash2 :size="16" class="notion-menu__glyph" />
          <span>Видалити</span>
        </button>
      </div>

      <div
        v-if="imagePopover.isOpen.value"
        ref="imagePopover.root"
        class="image-popover"
        :style="popoverStyle"
        role="dialog"
        aria-label="Вставити зображення"
      >
        <p class="image-popover__title">Зображення за посиланням</p>
        <input
          ref="imagePopover.urlInput"
          v-model="imagePopover.url.value"
          type="url"
          class="image-popover__field"
          placeholder="https://..."
          @keydown.enter.prevent="imagePopover.confirm"
          @keydown.escape.prevent="imagePopover.close"
        />
        <input
          v-model="imagePopover.alt.value"
          type="text"
          class="image-popover__field"
          placeholder="Опис зображення (необовʼязково)"
          @keydown.enter.prevent="imagePopover.confirm"
          @keydown.escape.prevent="imagePopover.close"
        />
        <div class="image-popover__actions">
          <button class="image-popover__btn" type="button" @click="imagePopover.close">
            Скасувати
          </button>
          <button
            class="image-popover__btn image-popover__btn--primary"
            type="button"
            :disabled="!imagePopover.url.value.trim()"
            @click="imagePopover.confirm"
          >
            Вставити
          </button>
        </div>
      </div>
    </div>

    <div v-if="bubbleBox" ref="bubbleRoot" class="bubble" :style="bubbleStyle" @mousedown.prevent>
      <template v-if="linkActive">
        <button class="bubble__btn" type="button" @click="openLink">Відкрити</button>
        <button class="bubble__btn" type="button" @click="actions.setLink">Змінити</button>
        <button class="bubble__btn" type="button" @click="copyLink">Скопіювати</button>
        <span class="bubble__sep" />
        <button
          class="bubble__btn bubble__btn--icon"
          type="button"
          title="Прибрати посилання"
          @click="removeLink"
        >
          <X :size="15" />
        </button>
      </template>

      <template v-else>
        <button
          class="bubble__btn bubble__btn--wide"
          :class="{ 'is-open': styleMenuOpen }"
          type="button"
          @click="toggleStyleMenu"
        >
          <span>Aa</span>
          <ChevronDown :size="11" />
        </button>
        <span class="bubble__sep" />
        <button
          class="bubble__btn"
          :class="{ 'is-active': editor?.isActive('bold') }"
          type="button"
          title="Жирний"
          @click="actions.toggleBold"
        >
          <strong>B</strong>
        </button>
        <button
          class="bubble__btn"
          :class="{ 'is-active': editor?.isActive('italic') }"
          type="button"
          title="Курсив"
          @click="actions.toggleItalic"
        >
          <em>I</em>
        </button>
        <button
          class="bubble__btn"
          :class="{ 'is-active': editor?.isActive('underline') }"
          type="button"
          title="Підкреслення"
          @click="actions.toggleUnderline"
        >
          <u>U</u>
        </button>
        <button
          class="bubble__btn"
          :class="{ 'is-active': editor?.isActive('strike') }"
          type="button"
          title="Закреслення"
          @click="actions.toggleStrike"
        >
          <s>S</s>
        </button>
        <button
          class="bubble__btn bubble__btn--icon"
          :class="{ 'is-active': editor?.isActive('code') }"
          type="button"
          title="Код"
          @click="toggleCodeMark"
        >
          <Code :size="15" />
        </button>
        <button
          class="bubble__btn bubble__btn--icon"
          :class="{ 'is-active': editor?.isActive('link') }"
          type="button"
          title="Посилання"
          @click="actions.setLink"
        >
          <Link :size="15" />
        </button>
        <button
          class="bubble__btn bubble__btn--icon"
          :class="{ 'is-active': editor?.isActive('highlight') }"
          type="button"
          title="Підсвітка"
          @click="actions.toggleHighlight"
        >
          <Highlighter :size="15" />
        </button>
        <span class="bubble__sep" />
        <button
          class="bubble__btn bubble__btn--icon"
          :class="{ 'is-open': moreMenuOpen }"
          type="button"
          title="Ще"
          @click="toggleMoreMenu"
        >
          <MoreHorizontal :size="16" />
        </button>
      </template>

      <div
        v-if="styleMenuOpen"
        class="notion-menu bubble__menu"
        :class="{ 'bubble__menu--above': !menuBelow }"
        role="menu"
      >
        <p class="notion-menu__label">Перетворити на</p>
        <button
          v-for="item in turnIntoItems"
          :key="item.label"
          class="notion-menu__item"
          type="button"
          @click="applyTurnInto(item.run)"
        >
          <component :is="item.icon" :size="16" class="notion-menu__glyph" />
          <span>{{ item.label }}</span>
        </button>
      </div>

      <div
        v-if="moreMenuOpen"
        class="notion-menu bubble__menu"
        :class="{ 'bubble__menu--above': !menuBelow }"
        role="menu"
      >
        <p class="notion-menu__label">Колір виділення</p>
        <div class="bubble__swatches">
          <button
            v-for="swatch in highlightColors"
            :key="swatch.color"
            class="swatch"
            type="button"
            :title="swatch.label"
            :style="{ backgroundColor: swatch.color }"
            @click="pickHighlight(swatch.color)"
          />
          <button
            class="swatch swatch--clear"
            type="button"
            title="Без кольору"
            @click="pickHighlight('')"
          >
            <X :size="11" />
          </button>
        </div>
        <span class="notion-menu__divider" />
        <p class="notion-menu__label">Вирівнювання</p>
        <div class="bubble__row">
          <button
            class="bubble__btn"
            type="button"
            title="Ліворуч"
            @click="runMore(() => actions.setAlignment('left'))"
          >
            <AlignLeft :size="15" />
          </button>
          <button
            class="bubble__btn"
            type="button"
            title="По центру"
            @click="runMore(() => actions.setAlignment('center'))"
          >
            <AlignCenter :size="15" />
          </button>
          <button
            class="bubble__btn"
            type="button"
            title="Праворуч"
            @click="runMore(() => actions.setAlignment('right'))"
          >
            <AlignRight :size="15" />
          </button>
        </div>
        <span class="notion-menu__divider" />
        <button class="notion-menu__item" type="button" @click="runMore(actions.undo)">
          <Undo2 :size="16" class="notion-menu__glyph" />
          <span>Скасувати</span>
        </button>
        <button class="notion-menu__item" type="button" @click="runMore(actions.redo)">
          <Redo2 :size="16" class="notion-menu__glyph" />
          <span>Повернути</span>
        </button>
        <button class="notion-menu__item" type="button" @click="runMore(actions.clearFormatting)">
          <RemoveFormatting :size="16" class="notion-menu__glyph" />
          <span>Очистити форматування</span>
        </button>
        <p class="notion-menu__foot">{{ characterCount }} символів</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ——— Оболонка у стилі Notion: чиста сторінка без важких бордерів ——— */
.text-editor {
  --n-hover: color-mix(in srgb, var(--color-ink) 6%, transparent);
  --n-hover-strong: color-mix(in srgb, var(--color-ink) 10%, transparent);
  --n-menu-hover: color-mix(in srgb, var(--color-ink) 8%, transparent);
  --n-line: color-mix(in srgb, var(--color-ink) 12%, transparent);
  --n-line-strong: color-mix(in srgb, var(--color-ink) 24%, transparent);
  --n-muted: color-mix(in srgb, var(--color-ink) 45%, transparent);
  --n-menu-shadow:
    0 0 0 1px color-mix(in srgb, var(--color-ink) 6%, transparent), 0 3px 6px rgba(15, 15, 15, 0.1),
    0 9px 24px rgba(15, 15, 15, 0.2);

  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: var(--color-accent-paper);
  color: var(--color-ink);
  font-family:
    ui-sans-serif,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Helvetica,
    'Apple Color Emoji',
    Arial,
    sans-serif,
    'Segoe UI Emoji',
    'Segoe UI Symbol';
}

.text-editor__body {
  position: relative;
  min-height: 460px;
  padding: 40px clamp(16px, 6vw, 96px) 80px;
}

.text-editor__body :deep(.ProseMirror) {
  min-height: 380px;
  outline: none;
  white-space: pre-wrap;
  font-size: 16px;
  line-height: 1.5;
  color: var(--color-ink);
  caret-color: var(--color-ink);
  word-wrap: break-word;
}

.text-editor__body :deep(.ProseMirror ::selection) {
  background: color-mix(in srgb, var(--color-secondary-blue) 30%, transparent);
}

.text-editor__body :deep(.ProseMirror > *) {
  margin: 0.15em 0;
}

.text-editor__body :deep(.ProseMirror p) {
  margin: 0.15em 0;
}

/* ——— Заголовки як у Notion ——— */
.text-editor__body :deep(.ProseMirror h1) {
  margin: 1.4em 0 0.35em;
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.text-editor__body :deep(.ProseMirror h1:first-child) {
  margin-top: 0;
}
.text-editor__body :deep(.ProseMirror h2) {
  margin: 1.1em 0 0.3em;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.text-editor__body :deep(.ProseMirror h3) {
  margin: 1em 0 0.25em;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
}

/* ——— Списки ——— */
.text-editor__body :deep(.ProseMirror ul),
.text-editor__body :deep(.ProseMirror ol) {
  padding-left: 1.5em;
}
.text-editor__body :deep(.ProseMirror ul) {
  list-style: disc outside;
}
.text-editor__body :deep(.ProseMirror ol) {
  list-style: decimal outside;
}
.text-editor__body :deep(.ProseMirror ul ul) {
  list-style-type: circle;
}
.text-editor__body :deep(.ProseMirror ul ul ul) {
  list-style-type: square;
}
.text-editor__body :deep(.ProseMirror ol ol) {
  list-style-type: lower-alpha;
}
.text-editor__body :deep(.ProseMirror ol ol ol) {
  list-style-type: lower-roman;
}
.text-editor__body :deep(.ProseMirror li) {
  margin: 0.1em 0;
  padding-left: 0.15em;
}
.text-editor__body :deep(.ProseMirror li > ul),
.text-editor__body :deep(.ProseMirror li > ol) {
  margin-top: 0.1em;
  margin-bottom: 0.1em;
}

/* ——— Цитата як у Notion: товсті лінії з обох боків ——— */
.text-editor__body :deep(.ProseMirror blockquote) {
  margin: 1em 0;
  border-left: 3px solid var(--color-ink);
  border-right: 3px solid var(--color-ink);
  padding: 4px 16px;
}

/* ——— Код ——— */
.text-editor__body :deep(.ProseMirror pre) {
  margin: 1em 0;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-ink) 8%, transparent);
  padding: 32px 16px;
  overflow-x: auto;
}
.text-editor__body :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.875em;
  line-height: 1.6;
  color: inherit;
}
.text-editor__body :deep(.ProseMirror :not(pre) > code) {
  border-radius: 3px;
  background: color-mix(in srgb, var(--color-ink) 8%, transparent);
  padding: 0.15em 0.3em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.875em;
}

/* ——— Посилання, підсвітка, роздільник ——— */
.text-editor__body :deep(.ProseMirror a) {
  color: var(--color-secondary-blue);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.text-editor__body :deep(.ProseMirror mark) {
  border-radius: 2px;
  color: inherit;
}
.text-editor__body :deep(.ProseMirror hr) {
  width: 100%;
  margin: 1.2em 0;
  border: 0;
  border-top: 1px solid var(--n-line-strong);
}

/* ——— Зображення ——— */
.text-editor__body :deep(.ProseMirror img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0.5em 0;
}
.text-editor__body :deep(.ProseMirror .ProseMirror-selectednode) {
  outline: 2px solid var(--color-secondary-blue);
  outline-offset: 2px;
}

/* ——— Callout у стилі Notion ——— */
.text-editor__body :deep(.ProseMirror aside[data-type='callout']) {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 1em 0;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-ink) 5%, transparent);
  padding: 16px 16px 16px 12px;
}
.text-editor__body :deep(.ProseMirror .callout-emoji) {
  flex: 0 0 auto;
  font-size: 1.25rem;
  line-height: 1.5;
}
.text-editor__body :deep(.ProseMirror .callout-content) {
  min-width: 0;
  flex: 1;
}

/* ——— Toggle у стилі Notion ——— */
.text-editor__body :deep(.ProseMirror .toggle-block) {
  margin: 0.15em 0;
  padding: 2px 0;
}
.text-editor__body :deep(.ProseMirror .toggle-header) {
  display: flex;
  align-items: center;
  gap: 4px;
}
.text-editor__body :deep(.ProseMirror .toggle-caret) {
  display: grid;
  flex: 0 0 24px;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--n-muted);
  padding: 0;
  cursor: pointer;
  font-size: 12px;
}
.text-editor__body :deep(.ProseMirror .toggle-caret:hover) {
  background: var(--n-hover);
  color: var(--color-ink);
}
.text-editor__body :deep(.ProseMirror .toggle-title) {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  padding: 2px 0;
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
  color: inherit;
  outline: none;
}
.text-editor__body :deep(.ProseMirror .toggle-title::placeholder) {
  color: var(--n-muted);
  font-weight: 400;
}
.text-editor__body :deep(.ProseMirror .toggle-content) {
  padding: 0 0 4px 28px;
}

/* ——— Список задач ——— */
.text-editor__body :deep(.ProseMirror ul[data-type='taskList']) {
  padding-left: 0;
  list-style: none;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li) {
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  margin: 0.15em 0;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > label) {
  display: flex;
  margin-top: 0.28rem;
  user-select: none;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > div) {
  min-width: 0;
  flex: 1;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > div p) {
  margin: 0.05em 0;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li[data-checked='true'] > div) {
  color: var(--n-muted);
  text-decoration: line-through;
}
.text-editor__body :deep(.ProseMirror input[type='checkbox']) {
  width: 16px;
  height: 16px;
  accent-color: var(--color-secondary-blue);
  cursor: pointer;
}

/* ——— Таблиці ——— */
.text-editor__body :deep(.ProseMirror .tableWrapper) {
  margin: 1em 0;
  overflow-x: auto;
}
.text-editor__body :deep(.ProseMirror table) {
  width: 100%;
  margin: 1em 0;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid var(--n-line-strong);
}
.text-editor__body :deep(.ProseMirror td),
.text-editor__body :deep(.ProseMirror th) {
  position: relative;
  box-sizing: border-box;
  min-width: 90px;
  border: 1px solid var(--n-line);
  padding: 7px 9px;
  vertical-align: top;
}
.text-editor__body :deep(.ProseMirror td > *),
.text-editor__body :deep(.ProseMirror th > *) {
  margin: 0;
}
.text-editor__body :deep(.ProseMirror th) {
  background: color-mix(in srgb, var(--color-ink) 4%, transparent);
  font-weight: 600;
  text-align: left;
}
.text-editor__body :deep(.ProseMirror .column-resize-handle) {
  position: absolute;
  top: 0;
  bottom: -2px;
  right: -2px;
  width: 4px;
  background: var(--color-secondary-blue);
  pointer-events: none;
}
.text-editor__body :deep(.ProseMirror.resize-cursor) {
  cursor: col-resize;
}
.text-editor__body :deep(.ProseMirror .selectedCell) {
  background: color-mix(in srgb, var(--color-secondary-blue) 20%, transparent);
}

/* ——— Плейсхолдер ——— */
.text-editor__body :deep(.ProseMirror p.is-editor-empty:first-child::before),
.text-editor__body :deep(.ProseMirror .is-empty::before) {
  float: left;
  height: 0;
  color: var(--n-muted);
  content: attr(data-placeholder);
  pointer-events: none;
}

/* ——— Гуттер блоку: «+» та маркер перетягування ——— */
.text-editor__gutter {
  position: absolute;
  z-index: 5;
  display: flex;
  gap: 2px;
}
.gutter-btn {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--n-muted);
  padding: 0;
  cursor: pointer;
}
.gutter-btn:hover {
  background: var(--n-hover);
  color: var(--color-ink);
}

/* ——— Синій індикатор скидання при перетягуванні ——— */
.text-editor__drop-line {
  position: absolute;
  z-index: 6;
  height: 3px;
  border-radius: 2px;
  background: var(--color-secondary-blue);
  pointer-events: none;
}

/* ——— Спільні меню в стилі Notion ——— */
.notion-menu {
  position: fixed;
  z-index: 50;
  min-width: 240px;
  max-width: 320px;
  max-height: 340px;
  overflow-y: auto;
  border-radius: 6px;
  background: var(--color-accent-paper);
  box-shadow: var(--n-menu-shadow);
  padding: 6px;
}
.notion-menu__label {
  margin: 4px 8px 6px;
  color: var(--n-muted);
  font-size: 11.5px;
  font-weight: 600;
}
.notion-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--color-ink);
  padding: 6px 8px;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.notion-menu__item:hover,
.notion-menu__item.is-selected {
  background: var(--n-menu-hover);
}
.notion-menu__item--danger:hover {
  background: color-mix(in srgb, var(--color-secondary-red) 15%, transparent);
}
.notion-menu__glyph {
  flex: 0 0 auto;
  color: var(--n-muted);
}
.notion-menu__divider {
  display: block;
  height: 1px;
  margin: 6px -6px;
  background: var(--n-line);
}
.notion-menu__foot {
  margin: 6px 8px 2px;
  color: var(--n-muted);
  font-size: 11.5px;
}
.slash-menu__icon {
  flex: 0 0 24px;
  color: var(--n-muted);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}
.slash-menu__name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.slash-menu__desc {
  margin-left: auto;
  color: var(--n-muted);
  font-size: 12.5px;
  white-space: nowrap;
}

/* ——— Bubble-тулбар над виділенням ——— */
.bubble {
  position: fixed;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 2px;
  transform: translateX(-50%);
  border-radius: 6px;
  background: var(--color-accent-paper);
  box-shadow: var(--n-menu-shadow);
  padding: 4px;
}
.bubble__btn {
  display: grid;
  min-width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--color-ink);
  padding: 0 5px;
  font-size: 14px;
  cursor: pointer;
}
.bubble__btn:hover,
.bubble__btn.is-open {
  background: var(--n-hover);
}
.bubble__btn.is-active {
  background: color-mix(in srgb, var(--color-secondary-blue) 15%, transparent);
}
.bubble__btn--wide {
  display: flex;
  min-width: auto;
  gap: 2px;
  align-items: center;
  padding: 0 6px;
}
.bubble__btn--icon {
  padding: 0;
}
.bubble__sep {
  width: 1px;
  height: 20px;
  margin: 0 3px;
  background: var(--n-line);
}
.bubble__row {
  display: flex;
  gap: 2px;
}
.bubble__swatches {
  display: flex;
  gap: 6px;
  padding: 2px 8px 4px;
}
.swatch {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--n-line);
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
}
.swatch:hover {
  border-color: var(--n-line-strong);
  transform: scale(1.1);
}
.swatch--clear {
  background: transparent;
  color: var(--n-muted);
}
.bubble__menu {
  top: calc(100% + 6px);
  left: 50%;
  min-width: 250px;
  transform: translateX(-50%);
}
.bubble__menu--above {
  top: auto;
  bottom: calc(100% + 6px);
}

/* ——— Поповер зображення ——— */
.image-popover {
  position: fixed;
  z-index: 60;
  width: min(304px, calc(100vw - 16px));
  border-radius: 6px;
  background: var(--color-accent-paper);
  box-shadow: var(--n-menu-shadow);
  padding: 12px;
}
.image-popover__title {
  margin: 0 0 8px;
  color: var(--n-muted);
  font-size: 11.5px;
  font-weight: 600;
}
.image-popover__field {
  display: block;
  width: 100%;
  border: 1px solid var(--n-line-strong);
  border-radius: 4px;
  background: transparent;
  color: var(--color-ink);
  padding: 6px 8px;
  font-size: 14px;
  font-family: inherit;
}
.image-popover__field + .image-popover__field {
  margin-top: 8px;
}
.image-popover__field:focus {
  border-color: var(--color-secondary-blue);
  outline: none;
}
.image-popover__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.image-popover__btn {
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--color-ink);
  padding: 6px 12px;
  font-size: 13.5px;
  font-family: inherit;
  cursor: pointer;
}
.image-popover__btn:hover {
  background: var(--n-hover);
}
.image-popover__btn--primary {
  background: var(--color-secondary-blue);
  color: #ffffff;
}
.image-popover__btn--primary:hover {
  background: color-mix(in srgb, var(--color-secondary-blue) 85%, #000000);
}
.image-popover__btn--primary:disabled {
  background: var(--n-hover);
  color: var(--n-muted);
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .text-editor__body {
    min-height: 360px;
    padding: 24px 18px 56px;
  }
  .text-editor__gutter {
    display: none;
  }
  .text-editor__body :deep(.ProseMirror h1) {
    font-size: 1.6rem;
  }
  .text-editor__body :deep(.ProseMirror table) {
    display: block;
    overflow-x: auto;
  }
}
</style>
