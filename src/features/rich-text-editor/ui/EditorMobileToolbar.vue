<script setup lang="ts">
import { computed } from 'vue'
import { useFocusWithin, useMediaQuery } from '@vueuse/core'
import type { Blok } from '@bloklabs/core'
import { EDITOR_COMMAND_GROUPS, type EditorCommand, runEditorCommand } from '../model/editorCommands'
import { useKeyboardInset } from '../model/useKeyboardInset'

defineOptions({ name: 'EditorMobileToolbar' })

const props = defineProps<{
  blok: Blok | null
  /** Елемент редактора: тулбар показується, поки в ньому є фокус. */
  editorEl: HTMLElement | null
}>()

const isTouchDevice = useMediaQuery('(pointer: coarse)')
const { focused: isEditing } = useFocusWithin(computed(() => props.editorEl))
const { inset } = useKeyboardInset()

const isVisible = computed(() => isTouchDevice.value && isEditing.value && Boolean(props.blok))

function run(command: EditorCommand) {
  if (props.blok) void runEditorCommand(props.blok, command)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-full opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="isVisible"
        role="toolbar"
        aria-label="Інструменти редактора"
        class="fixed inset-x-0 z-50 flex items-center gap-1 overflow-x-auto border-t border-base-300 bg-base-100 px-2 py-1 shadow-lg"
        :style="{ bottom: `${inset}px` }"
        @pointerdown.prevent
        @mousedown.prevent
      >
        <template v-for="(group, index) in EDITOR_COMMAND_GROUPS" :key="index">
          <div v-if="index > 0" class="mx-1 h-5 w-px shrink-0 bg-base-300" aria-hidden="true" />
          <button
            v-for="item in group"
            :key="item.command"
            type="button"
            class="btn btn-ghost btn-square btn-sm shrink-0"
            :aria-label="item.label"
            @click="run(item.command)"
          >
            <component :is="item.icon" :size="18" />
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>
