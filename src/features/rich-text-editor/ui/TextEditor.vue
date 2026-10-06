<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { EditorContent, useEditor, type Content, type JSONContent } from '@tiptap/vue-3'
import { createExtensions } from '../model/extensions'
import { pasteMarkdown } from '../model/markdown'
import { createSlashCommands } from '../model/slashCommands'
import { useEditorActions } from '../model/useEditorActions'
import { useImagePopover } from '../model/useImagePopover'
import { useSlashMenu } from '../model/useSlashMenu'

defineOptions({ name: 'TextEditor' })

const props = withDefaults(defineProps<{ content?: Content; placeholder?: string }>(), {
  content: '<h1>Нова нотатка</h1><p>Почніть писати тут...</p>',
  placeholder: 'Натисніть «/», щоб додати блок, або почніть писати…',
})
const emit = defineEmits<{ 'update:content': [value: JSONContent]; update: [value: JSONContent] }>()

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
    slashMenu.syncWithSelection()
  },
  onSelectionUpdate: () => slashMenu.syncWithSelection(),
})

// The slash menu reads its commands lazily, which breaks the cycle
// slashMenu -> slashCommands -> actions -> slashMenu.close.
const slashMenu = useSlashMenu(editor, () => slashCommands)
const actions = useEditorActions(editor, slashMenu.close)
const imagePopover = useImagePopover(editor, slashMenu.close)
const slashCommands = createSlashCommands(actions, imagePopover.open)

const slashMenuRef = ref<HTMLElement | null>(null)
const characterCount = computed(() => editor.value?.storage.characterCount?.characters() ?? 0)

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
    <div class="text-editor__toolbar" aria-label="Панель форматування">
      <button
        class="text-editor__tool text-editor__tool--wide"
        type="button"
        title="Заголовок"
        @click="actions.setHeading(1)"
      >
        Aa⌄
      </button>
      <span class="text-editor__divider" />
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('bold') }"
        type="button"
        title="Жирний"
        @click="actions.toggleBold"
      >
        <strong>B</strong>
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('italic') }"
        type="button"
        title="Курсив"
        @click="actions.toggleItalic"
      >
        <em>I</em>
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('underline') }"
        type="button"
        title="Підкреслення"
        @click="actions.toggleUnderline"
      >
        <u>U</u>
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('strike') }"
        type="button"
        title="Закреслення"
        @click="actions.toggleStrike"
      >
        <s>S</s>
      </button>
      <span class="text-editor__divider" />
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('bulletList') }"
        type="button"
        title="Маркований список"
        @click="actions.toggleBulletList"
      >
        ☷
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('orderedList') }"
        type="button"
        title="Нумерований список"
        @click="actions.toggleOrderedList"
      >
        ☷<small>1</small>
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('taskList') }"
        type="button"
        title="Список задач"
        @click="actions.toggleTaskList"
      >
        ☑
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('blockquote') }"
        type="button"
        title="Цитата"
        @click="actions.toggleBlockquote"
      >
        ❝
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('codeBlock') }"
        type="button"
        title="Код"
        @click="actions.toggleCodeBlock"
      >
        &lt;/&gt;
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('link') }"
        type="button"
        title="Посилання"
        @click="actions.setLink"
      >
        ↗
      </button>
      <button
        class="text-editor__tool"
        :class="{ 'is-active': editor?.isActive('highlight') }"
        type="button"
        title="Підсвічування"
        @click="actions.toggleHighlight"
      >
        ▰
      </button>
      <button
        class="text-editor__tool"
        type="button"
        title="По центру"
        @click="actions.setAlignment('center')"
      >
        ≡
      </button>
      <div ref="imagePopover.root" class="text-editor__popover-anchor">
        <button
          class="text-editor__tool"
          :class="{ 'is-active': imagePopover.isOpen.value }"
          type="button"
          title="Зображення"
          @click="imagePopover.toggle"
        >
          ▧
        </button>
        <div
          v-if="imagePopover.isOpen.value"
          class="image-popover"
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
      <button
        class="text-editor__tool"
        type="button"
        title="Вставити таблицю"
        @click="actions.insertTable"
      >
        ▦
      </button>
      <template v-if="editor?.isActive('table')">
        <span class="text-editor__divider" />
        <button
          class="text-editor__tool"
          type="button"
          title="Додати рядок"
          @click="actions.addRowAfter"
        >
          +▭
        </button>
        <button
          class="text-editor__tool"
          type="button"
          title="Додати колонку"
          @click="actions.addColumnAfter"
        >
          ▯+
        </button>
        <button
          class="text-editor__tool"
          type="button"
          title="Видалити рядок"
          @click="actions.deleteRow"
        >
          ▭−
        </button>
        <button
          class="text-editor__tool"
          type="button"
          title="Видалити колонку"
          @click="actions.deleteColumn"
        >
          ▯−
        </button>
        <button
          class="text-editor__tool"
          type="button"
          title="Видалити таблицю"
          @click="actions.deleteTable"
        >
          ✕▦
        </button>
      </template>
      <span class="text-editor__spacer" />
      <button
        class="text-editor__tool"
        type="button"
        title="Скасувати"
        :disabled="!editor?.can().undo()"
        @click="actions.undo"
      >
        ↶
      </button>
      <button
        class="text-editor__tool"
        type="button"
        title="Повторити"
        :disabled="!editor?.can().redo()"
        @click="actions.redo"
      >
        ↷
      </button>
    </div>
    <div
      class="text-editor__body"
      @keydown.capture="slashMenu.handleKeydown"
      @paste.capture="handlePaste"
    >
      <EditorContent :editor="editor" />
      <div v-if="slashMenu.isShown.value" ref="slashMenuRef" class="slash-menu" role="menu">
        <p class="slash-menu__hint">Блоки · {{ slashMenu.visibleCommands.value.length }}</p>
        <button
          v-for="(command, index) in slashMenu.visibleCommands.value"
          :key="command.name"
          class="slash-menu__item"
          :class="{ 'is-selected': index === slashMenu.activeIndex.value }"
          type="button"
          role="menuitem"
          :aria-selected="index === slashMenu.activeIndex.value"
          @mouseenter="slashMenu.activeIndex.value = index"
          @mousedown.prevent="slashMenu.select(command)"
        >
          <span class="slash-menu__icon">{{ command.icon }}</span
          ><span
            ><strong>{{ command.name }}</strong
            ><small>{{ command.description }}</small></span
          >
        </button>
      </div>
    </div>
    <footer class="text-editor__footer">
      <span><kbd>⌘</kbd><kbd>Enter</kbd> виконати</span><span>{{ characterCount }} символів</span>
    </footer>
  </div>
</template>

<style scoped>
.text-editor {
  overflow: hidden;
  border: 3px solid var(--color-ink);
  border-radius: 18px;
  background: var(--color-accent-paper);
  color: var(--color-ink);
  box-shadow: 4px 4px 0 var(--color-ink);
}
.text-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  min-height: 52px;
  align-items: center;
  gap: 3px;
  border-bottom: 3px solid var(--color-ink);
  background: var(--color-bg);
  padding: 7px 10px;
}
.text-editor__tool {
  display: grid;
  min-width: 36px;
  height: 36px;
  place-items: center;
  border: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
}
.text-editor__tool:hover,
.text-editor__tool.is-active {
  border-color: var(--color-ink);
  background: var(--color-primary-yellow);
  color: #171717;
}
.text-editor__tool:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
.text-editor__tool--wide {
  width: 48px;
  font-size: 12px;
}
.text-editor__tool small {
  margin-left: -8px;
  align-self: end;
  font-size: 9px;
}
.text-editor__divider {
  height: 22px;
  width: 2px;
  background: var(--color-ink);
  opacity: 0.2;
  margin: 0 5px;
}
.text-editor__spacer {
  flex: 1;
}
.text-editor__popover-anchor {
  position: relative;
  display: inline-flex;
}
.image-popover {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  width: min(300px, calc(100vw - 40px));
  border: 3px solid var(--color-ink);
  border-radius: 12px;
  background: var(--color-accent-paper);
  padding: 14px;
  box-shadow: 4px 4px 0 var(--color-ink);
}
.image-popover__title {
  margin: 0 0 9px;
  color: var(--color-ink-light);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.image-popover__field {
  display: block;
  width: 100%;
  border: 2px solid var(--color-ink);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-ink);
  padding: 8px 10px;
  font-size: 14px;
}
.image-popover__field + .image-popover__field {
  margin-top: 8px;
}
.image-popover__field:focus {
  outline: none;
  background: var(--color-accent-paper);
  box-shadow: 0 0 0 2px var(--color-primary-yellow) inset;
}
.image-popover__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.image-popover__btn {
  border: 2px solid var(--color-ink);
  border-radius: 8px;
  background: var(--color-accent-paper);
  color: var(--color-ink);
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.image-popover__btn:hover {
  transform: translateY(-1px);
}
.image-popover__btn--primary {
  background: var(--color-primary-yellow);
  color: #171717;
}
.image-popover__btn--primary:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  transform: none;
}
.text-editor__body {
  position: relative;
  min-height: 450px;
  padding: 34px clamp(20px, 5vw, 72px) 52px;
}
@media (max-width: 639px) {
  .text-editor__toolbar {
    padding: 6px;
  }
  .text-editor__divider {
    display: none;
  }
  .text-editor__spacer {
    display: none;
  }
  .text-editor__body {
    min-height: 320px;
    padding: 20px 16px 40px;
  }
  .text-editor__body :deep(.ProseMirror) {
    min-height: 240px;
  }
  .text-editor__body :deep(.ProseMirror h2) {
    font-size: 1.4rem;
  }
  .text-editor__body :deep(.ProseMirror table) {
    display: block;
    overflow-x: auto;
  }
  .image-popover {
    position: fixed;
    left: 16px;
    right: 16px;
    top: auto;
    width: auto;
  }
}
.text-editor__body :deep(.ProseMirror) {
  min-height: 365px;
  outline: none;
  font-size: 16px;
  line-height: 1.75;
}
.text-editor__body :deep(.ProseMirror > *) {
  margin: 0.65em 0;
}
.text-editor__body :deep(.ProseMirror h1) {
  margin-top: 0;
  font-size: clamp(2rem, 4vw, 3.15rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}
.text-editor__body :deep(.ProseMirror h2) {
  margin-top: 1.5em;
  font-size: 1.7rem;
  line-height: 1.15;
  letter-spacing: -0.03em;
}
.text-editor__body :deep(.ProseMirror h3) {
  font-size: 1.25rem;
}
.text-editor__body :deep(.ProseMirror ul),
.text-editor__body :deep(.ProseMirror ol) {
  padding-left: 1.4em;
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
  margin: 0.2em 0;
  padding-left: 0.2em;
}
.text-editor__body :deep(.ProseMirror li::marker) {
  font-weight: 700;
}
.text-editor__body :deep(.ProseMirror li > ul),
.text-editor__body :deep(.ProseMirror li > ol) {
  margin-top: 0.2em;
}
.text-editor__body :deep(.ProseMirror blockquote) {
  border-left: 4px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-accent-paper));
  padding: 0.75rem 1rem;
  font-weight: 600;
}
.text-editor__body :deep(.ProseMirror code) {
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-ink) 12%, var(--color-accent-paper));
  padding: 0.15em 0.35em;
  font-size: 0.9em;
}
.text-editor__body :deep(.ProseMirror pre) {
  overflow-x: auto;
  border: 2px solid var(--color-ink);
  border-radius: 10px;
  background: var(--color-code-bg);
  color: var(--color-code-ink);
  padding: 1rem;
}
.text-editor__body :deep(.ProseMirror pre code) {
  background: transparent;
  color: inherit;
}
.text-editor__body :deep(.ProseMirror hr) {
  border: 0;
  border-top: 2px solid color-mix(in srgb, var(--color-ink) 30%, transparent);
}
.text-editor__body :deep(.ProseMirror a) {
  color: var(--color-secondary-blue);
  text-decoration: underline;
  text-decoration-thickness: 2px;
}
.text-editor__body :deep(.ProseMirror mark) {
  border-radius: 3px;
  background: color-mix(in srgb, var(--color-primary-yellow) 55%, var(--color-accent-paper));
  color: #171717;
  padding: 0.05em 0.12em;
}
.text-editor__body :deep(.ProseMirror img) {
  display: block;
  max-width: 100%;
  height: auto;
  border: 2px solid var(--color-ink);
  border-radius: 10px;
  box-shadow: 3px 3px 0 var(--color-ink);
}
.text-editor__body :deep(.ProseMirror aside[data-type='callout']) {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: 3px solid var(--color-ink);
  border-radius: 12px;
  background: var(--color-primary-yellow);
  color: #171717;
  padding: 14px;
  box-shadow: 2px 2px 0 var(--color-ink);
}
.text-editor__body :deep(.ProseMirror .callout-emoji) {
  flex: 0 0 auto;
  font-size: 1.35rem;
  line-height: 1.5;
}
.text-editor__body :deep(.ProseMirror .callout-content) {
  min-width: 0;
  flex: 1;
}
.text-editor__body :deep(.ProseMirror .toggle-block) {
  border: 2px solid color-mix(in srgb, var(--color-ink) 30%, transparent);
  border-radius: 10px;
  padding: 2px 13px;
}
.text-editor__body :deep(.ProseMirror .toggle-header) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
}
.text-editor__body :deep(.ProseMirror .toggle-caret) {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 12px;
}
.text-editor__body :deep(.ProseMirror .toggle-caret:hover) {
  background: var(--color-bg);
}
.text-editor__body :deep(.ProseMirror .toggle-title) {
  flex: 1;
  border: 0;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  font-weight: 800;
  color: inherit;
  outline: none;
}
.text-editor__body :deep(.ProseMirror .toggle-title::placeholder) {
  color: var(--color-ink-light);
  font-weight: 800;
}
.text-editor__body :deep(.ProseMirror .toggle-content) {
  padding: 0 0 10px 30px;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList']) {
  padding: 0;
  list-style: none;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li) {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin: 0.35em 0;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > label) {
  display: flex;
  margin-top: 0.25rem;
  user-select: none;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > div) {
  min-width: 0;
  flex: 1;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li > div p) {
  margin: 0;
}
.text-editor__body :deep(.ProseMirror ul[data-type='taskList'] > li[data-checked='true'] > div) {
  color: var(--color-ink-light);
  text-decoration: line-through;
}
.text-editor__body :deep(.ProseMirror input[type='checkbox']) {
  accent-color: var(--color-ink);
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.text-editor__body :deep(.ProseMirror .tableWrapper) {
  margin: 1em 0;
  overflow-x: auto;
}
.text-editor__body :deep(.ProseMirror table) {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  border: 2px solid var(--color-ink);
  border-radius: 10px;
  overflow: hidden;
}
.text-editor__body :deep(.ProseMirror td),
.text-editor__body :deep(.ProseMirror th) {
  position: relative;
  box-sizing: border-box;
  min-width: 90px;
  border: 1px solid var(--color-ink);
  padding: 0.5em 0.7em;
  vertical-align: top;
}
.text-editor__body :deep(.ProseMirror td > *),
.text-editor__body :deep(.ProseMirror th > *) {
  margin: 0;
}
.text-editor__body :deep(.ProseMirror th) {
  background: var(--color-primary-yellow);
  color: #171717;
  font-weight: 800;
  text-align: left;
}
.text-editor__body :deep(.ProseMirror .column-resize-handle) {
  position: absolute;
  top: 0;
  bottom: -2px;
  right: -2px;
  width: 4px;
  background: var(--color-ink);
  pointer-events: none;
}
.text-editor__body :deep(.ProseMirror.resize-cursor) {
  cursor: col-resize;
}
.text-editor__body :deep(.ProseMirror .selectedCell) {
  background: color-mix(in srgb, var(--color-primary-yellow) 35%, transparent);
}
.text-editor__body :deep(.ProseMirror p.is-editor-empty:first-child::before),
.text-editor__body :deep(.ProseMirror p.is-empty::before) {
  float: left;
  height: 0;
  color: var(--color-ink-light);
  content: attr(data-placeholder);
  pointer-events: none;
}
.text-editor__footer {
  display: flex;
  justify-content: space-between;
  border-top: 2px solid var(--color-ink);
  color: var(--color-ink-light);
  font-size: 11px;
  padding: 9px 16px;
}
.text-editor__footer kbd {
  border: 1px solid var(--color-ink);
  border-radius: 4px;
  background: var(--color-bg);
  padding: 1px 4px;
  margin-right: 2px;
}
.slash-menu {
  position: absolute;
  z-index: 10;
  top: 98px;
  left: clamp(20px, 5vw, 72px);
  width: min(310px, calc(100% - 40px));
  max-height: min(390px, 60vh);
  overflow-y: auto;
  border: 3px solid var(--color-ink);
  border-radius: 12px;
  background: var(--color-accent-paper);
  box-shadow: 4px 4px 0 var(--color-ink);
  padding: 6px;
}
.slash-menu__hint {
  margin: 4px 8px 5px;
  color: var(--color-ink-light);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.slash-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-ink);
  padding: 8px;
  text-align: left;
  cursor: pointer;
}
.slash-menu__item:hover,
.slash-menu__item.is-selected {
  background: var(--color-primary-yellow);
  color: #171717;
}
.slash-menu__item strong,
.slash-menu__item small {
  display: block;
}
.slash-menu__item small {
  color: var(--color-ink-light);
  font-size: 11px;
}
.slash-menu__item:hover small,
.slash-menu__item.is-selected small {
  color: #171717;
  opacity: 0.7;
}
.slash-menu__icon {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 2px solid var(--color-ink);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-ink);
  font-size: 11px;
  font-weight: 900;
}
@media (max-width: 640px) {
  .text-editor__toolbar {
    flex-wrap: wrap;
  }
  .text-editor__body {
    padding: 25px 18px 42px;
  }
}
</style>
