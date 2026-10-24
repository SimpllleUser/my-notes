<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import NoteSidebar from '../ui/NoteSidebar.vue'
import { TextEditor } from '@/features/rich-text-editor'
import ToggleSidebarButton from '@/pages/folder/ui/ToggleSidebarButton.vue'
import type { BlockChange } from '@/features/rich-text-editor/model/useBlockSave.ts'
import type { Note } from '@/entities/note'
import type { Nullable } from '@/shared/model/types.ts'

defineOptions({
  name: 'FolderPage',
})

const route = useRoute()
const activeNote = ref<Nullable<Note>>(null)

const folder = computed(
  () => (route.params as { name: string; id: string }) || { name: '', id: '' },
)

const sidebarCollapsed = useLocalStorage('folder-page-sidebar-collapsed', false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
const updateTextEditor = (content: BlockChange[]) => {
  /// Action only call actual trigger for backend
  /// Make consistent value of text editor from backend
  console.log(content)
}

const content = ref(``)
const changeNote = (note: Note) => {
  activeNote.value = note
}

watch(
  () => activeNote.value?.$id,
  (old, newVal) => {
    if (old === newVal) return
    // fetch nodes from note
  },
)
</script>

<template>
  <main class="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4">
    <Transition name="folder-header">
      <header v-show="sidebarCollapsed" class="fixed flex items-center gap-3">
        <ToggleSidebarButton :collapsed="sidebarCollapsed" @click="toggleSidebar()" />
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Папка</p>
          <h1 class="truncate text-lg font-black sm:text-xl">{{ folder.name }}</h1>
        </div>
      </header>
    </Transition>

    <div
      class="grid min-w-0 grid-cols-1 items-start gap-4 transition-[grid-template-columns,gap] duration-300 ease-out motion-reduce:transition-none"
      :class="
        sidebarCollapsed
          ? 'md:grid-cols-[0px_minmax(0,1fr)] md:gap-0'
          : 'md:grid-cols-[264px_minmax(0,1fr)] lg:grid-cols-[324px_minmax(0,1fr)]'
      "
    >
      <aside
        id="notes-sidebar"
        aria-label="Список нотаток"
        class="min-w-0 overflow-visible md:self-stretch"
      >
        <Transition name="folder-sidebar">
          <div
            v-show="!sidebarCollapsed"
            class="fixed inset-x-5 bottom-5 z-10 max-h-[45dvh] overflow-y-auto overscroll-contain md:sticky md:top-5 md:inset-x-auto md:bottom-auto md:max-h-[calc(100dvh-2.5rem)] md:w-[264px] lg:w-[324px]"
          >
            <NoteSidebar @set-note="changeNote" :folder="folder">
              <template #header-left>
                <ToggleSidebarButton :collapsed="sidebarCollapsed" @click="toggleSidebar()" />
              </template>
            </NoteSidebar>
          </div>
        </Transition>
      </aside>

      <div
        class="min-w-0 transition-[margin] duration-300 ease-out motion-reduce:transition-none"
        :class="{
          'mt-15': sidebarCollapsed,
        }"
      >
        <TextEditor :content="content" @changes="updateTextEditor" />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss" src="./FolderPage.scss" />
