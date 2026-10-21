<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import NoteSidebar from '../ui/NoteSidebar.vue'
import { TextEditor } from '@/features/rich-text-editor'
import ToggleSidebarButton from '@/pages/folder/ui/ToggleSidebarButton.vue'

defineOptions({
  name: 'FolderPage',
})

const route = useRoute()

const folder = computed(
  () => (route.params as { name: string; id: string }) || { name: '', id: '' },
)

const sidebarCollapsed = useLocalStorage('folder-page-sidebar-collapsed', false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <main class="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4">
    <header class="flex items-center gap-3 fixed" v-if="sidebarCollapsed">
      <ToggleSidebarButton :collapsed="sidebarCollapsed"  @click="toggleSidebar()" />
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Папка</p>
        <h1 class="truncate text-lg font-black sm:text-xl">{{ folder.name }}</h1>
      </div>
    </header>

    <div
      class="grid min-w-0 grid-cols-1 items-start gap-4 transition-[grid-template-columns,gap] duration-300"
      :class="
        sidebarCollapsed
          ? 'md:grid-cols-[0px_minmax(0,1fr)] md:gap-0'
          : 'md:grid-cols-[264px_minmax(0,1fr)] lg:grid-cols-[324px_minmax(0,1fr)]'
      "
    >
      <aside
        id="notes-sidebar"
        aria-label="Список нотаток"
        class="min-w-0 overflow-visible transition-[visibility] duration-300 md:self-stretch"
        :class="sidebarCollapsed ? 'hidden md:block md:invisible' : ''"
      >
        <div
          class="fixed inset-x-5 bottom-5 z-10 max-h-[45dvh] overflow-y-auto overscroll-contain md:sticky md:top-5 md:inset-x-auto md:bottom-auto md:max-h-[calc(100dvh-2.5rem)] md:w-[264px] lg:w-[324px]"
        >
          <NoteSidebar :folder="folder">
            <template #header-left>
              <ToggleSidebarButton :collapsed="sidebarCollapsed" @click="toggleSidebar()" />
            </template>
          </NoteSidebar>
        </div>
      </aside>

      <div
        class="min-w-0"
        :class="{
          'mt-15': sidebarCollapsed,
        }"
      >
        <TextEditor />
      </div>
    </div>
  </main>
</template>
