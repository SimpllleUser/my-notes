<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Code,
  Highlighter,
  Link,
  MoreHorizontal,
  Redo2,
  RemoveFormatting,
  Undo2,
  X,
} from '@lucide/vue'
import type { Editor } from '@tiptap/vue-3'
import type { EditorActions } from '../model/useEditorActions'
import type { TurnIntoItem, HighlightColor } from '../model/textEditorConfig'

defineOptions({ name: 'EditorBubbleToolbar' })

const props = defineProps<{
  editor: Editor | undefined
  style: Record<string, string>
  linkHref: string
  linkActive: boolean
  menuBelow: boolean
  characterCount: number
  turnIntoItems: TurnIntoItem[]
  highlightColors: HighlightColor[]
  actions: EditorActions
  closeBlockMenu: () => void
  hideGutter: () => void
}>()

const styleMenuOpen = ref(false)
const moreMenuOpen = ref(false)
const root = ref<HTMLElement | null>(null)

function closeMenus() {
  styleMenuOpen.value = false
  moreMenuOpen.value = false
}
function toggleStyleMenu() {
  styleMenuOpen.value = !styleMenuOpen.value
  moreMenuOpen.value = false
}
function toggleMoreMenu() {
  moreMenuOpen.value = !moreMenuOpen.value
  styleMenuOpen.value = false
}
function applyTurnInto(run: () => void) {
  closeMenus()
  props.closeBlockMenu()
  props.hideGutter()
  run()
}
function runMore(run: () => void) {
  moreMenuOpen.value = false
  run()
}
function pickHighlight(color: string) {
  moreMenuOpen.value = false
  props.actions.setHighlightColor(color || null)
}
function toggleCodeMark() {
  props.editor?.chain().focus().toggleCode().run()
}
function openLink() {
  if (props.linkHref) window.open(props.linkHref, '_blank', 'noopener,noreferrer')
}
function copyLink() {
  if (props.linkHref) void navigator.clipboard.writeText(props.linkHref)
}
function removeLink() {
  props.actions.unsetLink()
}
function onOutsideMousedown(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) closeMenus()
}

watch([styleMenuOpen, moreMenuOpen], ([styleOpen, moreOpen]) => {
  if (styleOpen || moreOpen) document.addEventListener('mousedown', onOutsideMousedown)
  else document.removeEventListener('mousedown', onOutsideMousedown)
})
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutsideMousedown))
watch(
  () => props.linkActive,
  (active) => {
    if (active) closeMenus()
  },
)
</script>

<template>
  <div
    ref="root"
    class="bubble"
    :style="props.style"
    @mousedown.prevent
    @keydown.escape="closeMenus"
  >
    <template v-if="props.linkActive">
      <button class="bubble__btn" type="button" @click="openLink">Відкрити</button>
      <button class="bubble__btn" type="button" @click="props.actions.setLink">Змінити</button>
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
        :class="{ 'is-active': props.editor?.isActive('bold') }"
        type="button"
        title="Жирний"
        @click="props.actions.toggleBold"
      >
        <strong>B</strong>
      </button>
      <button
        class="bubble__btn"
        :class="{ 'is-active': props.editor?.isActive('italic') }"
        type="button"
        title="Курсив"
        @click="props.actions.toggleItalic"
      >
        <em>I</em>
      </button>
      <button
        class="bubble__btn"
        :class="{ 'is-active': props.editor?.isActive('underline') }"
        type="button"
        title="Підкреслення"
        @click="props.actions.toggleUnderline"
      >
        <u>U</u>
      </button>
      <button
        class="bubble__btn"
        :class="{ 'is-active': props.editor?.isActive('strike') }"
        type="button"
        title="Закреслення"
        @click="props.actions.toggleStrike"
      >
        <s>S</s>
      </button>
      <button
        class="bubble__btn bubble__btn--icon"
        :class="{ 'is-active': props.editor?.isActive('code') }"
        type="button"
        title="Код"
        @click="toggleCodeMark"
      >
        <Code :size="15" />
      </button>
      <button
        class="bubble__btn bubble__btn--icon"
        :class="{ 'is-active': props.editor?.isActive('link') }"
        type="button"
        title="Посилання"
        @click="props.actions.setLink"
      >
        <Link :size="15" />
      </button>
      <button
        class="bubble__btn bubble__btn--icon"
        :class="{ 'is-active': props.editor?.isActive('highlight') }"
        type="button"
        title="Підсвітка"
        @click="props.actions.toggleHighlight"
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
      :class="{ 'bubble__menu--above': !props.menuBelow }"
      role="menu"
    >
      <p class="notion-menu__label">Перетворити на</p>
      <button
        v-for="item in props.turnIntoItems"
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
      :class="{ 'bubble__menu--above': !props.menuBelow }"
      role="menu"
    >
      <p class="notion-menu__label">Колір виділення</p>
      <div class="bubble__swatches">
        <button
          v-for="swatch in props.highlightColors"
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
          @click="runMore(() => props.actions.setAlignment('left'))"
        >
          <AlignLeft :size="15" />
        </button>
        <button
          class="bubble__btn"
          type="button"
          title="По центру"
          @click="runMore(() => props.actions.setAlignment('center'))"
        >
          <AlignCenter :size="15" />
        </button>
        <button
          class="bubble__btn"
          type="button"
          title="Праворуч"
          @click="runMore(() => props.actions.setAlignment('right'))"
        >
          <AlignRight :size="15" />
        </button>
      </div>
      <span class="notion-menu__divider" />
      <button class="notion-menu__item" type="button" @click="runMore(props.actions.undo)">
        <Undo2 :size="16" class="notion-menu__glyph" />
        <span>Скасувати</span>
      </button>
      <button class="notion-menu__item" type="button" @click="runMore(props.actions.redo)">
        <Redo2 :size="16" class="notion-menu__glyph" />
        <span>Повернути</span>
      </button>
      <button
        class="notion-menu__item"
        type="button"
        @click="runMore(props.actions.clearFormatting)"
      >
        <RemoveFormatting :size="16" class="notion-menu__glyph" />
        <span>Очистити форматування</span>
      </button>
      <p class="notion-menu__foot">{{ props.characterCount }} символів</p>
    </div>
  </div>
</template>

<style scoped src="./TextEditor.css"></style>
