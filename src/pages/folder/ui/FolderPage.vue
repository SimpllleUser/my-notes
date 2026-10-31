<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import NoteSidebar from '../ui/NoteSidebar.vue'
import ToggleSidebarButton from '@/pages/folder/ui/ToggleSidebarButton.vue'
import { NoteBlocksEditor } from '@/widgets/note-blocks-editor'
import { getSyncStatusView, type SyncStatus } from '@/entities/node'
import type { Note } from '@/entities/note'
import type { Nullable } from '@/shared/model/types.ts'
import { UiStatus } from '@/shared/ui'
import FolderHeader from '@/pages/folder/ui/FolderHeader.vue'

defineOptions({ name: 'FolderPage' })

const route = useRoute()
const folder = computed(() => route.params as { name: string; id: string })

const sidebarCollapsed = useLocalStorage('folder-page-sidebar-collapsed', false)
const toggleSidebar = () => (sidebarCollapsed.value = !sidebarCollapsed.value)

const activeNote = ref<Nullable<Note>>(null)
const changeNote = (note: Note) => (activeNote.value = note)

const syncStatus = ref<SyncStatus>('saved')
const statusView = computed(() => getSyncStatusView(syncStatus.value))
</script>

<template>
  <div class="fixed z-11 min-w-0 w-full max-w-360 px-8">
    <FolderHeader />
  </div>
  <main
    class="mx-auto flex w-full min-w-0 max-w-360 flex-col gap-4 px-8 pb-24 pt-(--header-h) [--header-h:8rem]"
  >
    <!--    Minimizaed sidebar-->
    <Transition name="folder-header">
      <header
        v-show="sidebarCollapsed"
        class="fixed inset-x-8 top-30 py-2 px-2 z-11 mx-auto flex max-w-[calc(90rem-4rem)] min-w-0 items-center justify-between gap-3 rounded-brutal bg-bg/90 backdrop-blur"
      >
        <div class="flex items-center">
          <ToggleSidebarButton :collapsed="sidebarCollapsed" @click="toggleSidebar()" />
          <div class="min-w-0 ml-5">
            <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Папка</p>
            <h1 class="truncate text-lg font-black sm:text-xl">{{ folder.name }}</h1>
          </div>
        </div>
        <UiStatus :label="statusView.label" :tone="statusView.tone" />
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
            class="fixed inset-x-5 bottom-5 z-10 max-h-[45dvh] overflow-y-auto overscroll-contain md:sticky md:inset-x-auto md:bottom-auto md:top-(--header-h) md:max-h-[calc(100dvh-var(--header-h)-1rem)] md:w-[264px] lg:w-[324px]"
          >
            <NoteSidebar :key="`${folder.id}`" @set-note="changeNote" :folder="folder">
              <template #header-left>
                <ToggleSidebarButton :collapsed="sidebarCollapsed" @click="toggleSidebar()" />
              </template>
            </NoteSidebar>
          </div>
        </Transition>
      </aside>

      <div
        class="min-w-0 transition-[margin] duration-300 ease-out motion-reduce:transition-none"
        :class="{ 'mt-10': sidebarCollapsed }"
      >
        <UiStatus v-if="!sidebarCollapsed" :label="statusView.label" :tone="statusView.tone" />

        <NoteBlocksEditor
          v-if="activeNote"
          :key="`${activeNote.$id}-${folder.id}`"
          v-model:status="syncStatus"
          :note-id="activeNote.$id"
        />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss" src="./FolderPage.scss" />
