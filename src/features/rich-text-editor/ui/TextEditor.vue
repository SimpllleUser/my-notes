<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { EditorContent, useEditor, type Content, type JSONContent } from '@tiptap/vue-3'
import { Copy, GripVertical, Plus, Trash2 } from '@lucide/vue'
import EditorBubbleToolbar from './EditorBubbleToolbar.vue'
import { createExtensions } from '../model/extensions'
import { pasteMarkdown } from '../model/markdown'
import { createSlashCommands } from '../model/slashCommands'
import { useBlockHandles } from '../model/useBlockHandles'
import { useEditorActions } from '../model/useEditorActions'
import { useImagePopover } from '../model/useImagePopover'
import { useOverlayPosition } from '../model/useOverlayPosition'
import { useSlashMenu } from '../model/useSlashMenu'
import {
  clampViewportPosition,
  createTurnIntoItems,
  HIGHLIGHT_COLORS,
} from '../model/textEditorConfig'

defineOptions({ name: 'TextEditor' })

const props = withDefaults(defineProps<{ content?: Content; placeholder?: string }>(), {
  content: '<h1>Нова нотатка</h1><p>Почніть писати тут...</p>',
  placeholder: 'Напишіть щось або натисніть «/», щоб додати блок…',
})
const emit = defineEmits<{ 'update:content': [value: JSONContent]; update: [value: JSONContent] }>()

const bodyRef = ref<HTMLElement | null>(null)
const slashMenuRef = ref<HTMLElement | null>(null)

const editor = useEditor({
  content: props.content,
  extensions: createExtensions(() => props.placeholder),
  onUpdate({ editor: instance }) {
    // `order` тепер є реальним атрибутом top-level блоків і підтримується
    // розширенням BlockOrder (див. model/extensions/blockOrder.ts) усередині документа,
    // тому перенумеровувати блоки вручну тут не потрібно — навіть після drag & drop.
    const json = instance.getJSON()

    emit('update:content', json)
    emit('update', json)
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

const turnIntoItems = createTurnIntoItems(actions)

// ——— Позиції плаваючих елементів (viewport-координати) ———
const slashStyle = computed(() => {
  const point = overlay.caret.value
  if (!point) return { display: 'none' }
  const menuWidth = 320
  const menuHeight = 340
  const left = clampViewportPosition(point.left, window.innerWidth, menuWidth)
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
  const left = clampViewportPosition(point.left, window.innerWidth, 312)
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
  if (event.key === 'Escape') closeBlockMenu()
}

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

    <EditorBubbleToolbar
      v-if="bubbleBox"
      :editor="editor"
      :style="bubbleStyle"
      :link-href="linkHref"
      :link-active="linkActive"
      :menu-below="menuBelow"
      :character-count="characterCount"
      :turn-into-items="turnIntoItems"
      :highlight-colors="HIGHLIGHT_COLORS"
      :close-block-menu="closeBlockMenu"
      :hide-gutter="hideGutter"
      :actions="actions"
    />
  </div>
</template>

<style scoped src="./TextEditor.css"></style>
