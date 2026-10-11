<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import NoteSidebar from '../ui/NoteSidebar.vue'
import { TextEditor } from '@/features/rich-text-editor'
import { UiIconButton } from '@/shared/ui'

defineOptions({
  name: 'FolderPage',
})

const route = useRoute()

const folder = computed(
  () => (route.params as { name: string; id: string }) || { name: '', id: '' },
)

/** Стан мінімізації sidebar: зберігається між сесіями. */
const sidebarCollapsed = useLocalStorage('folder-page-sidebar-collapsed', false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <main class="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4">
    <header class="flex items-center gap-3">
      <UiIconButton
        :label="sidebarCollapsed ? 'Показати список нотаток' : 'Мінімізувати список нотаток'"
        :aria-expanded="sidebarCollapsed ? 'false' : 'true'"
        aria-controls="notes-sidebar"
        @click="toggleSidebar"
      >
        <PanelLeftClose v-if="!sidebarCollapsed" :size="18" />
        <PanelLeftOpen v-else :size="18" />
      </UiIconButton>
      <div v-if="sidebarCollapsed" class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Папка</p>
        <h1 class="truncate text-lg font-black sm:text-xl">{{ folder.name }}</h1>
      </div>
    </header>
    <div
      class="grid min-w-0 grid-cols-1 gap-4 transition-[grid-template-columns,gap] duration-300"
      :class="
        sidebarCollapsed
          ? 'md:grid-cols-[0px_minmax(0,1fr)] md:gap-0'
          : 'md:grid-cols-[264px_minmax(0,1fr)] lg:grid-cols-[324px_minmax(0,1fr)]'
      "
    >
      <aside
        id="notes-sidebar"
        aria-label="Список нотаток"
        class="min-w-0 overflow-hidden transition-[visibility] duration-300"
        :class="sidebarCollapsed ? 'hidden md:block md:invisible' : ''"
      >
        <div class="w-full pr-1 pb-1 md:w-66 lg:w-81">
          <NoteSidebar :folder="folder" />
        </div>
      </aside>

      <div class="min-w-0">
        <TextEditor />
      </div>
    </div>
  </main>
</template>
