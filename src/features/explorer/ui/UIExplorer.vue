<script setup lang="ts">
import { type Component, computed, ref, shallowRef, watch } from 'vue'
import { useFolderSelect } from '@/entities/folder'
import { useNoteSelect } from '@/entities/note/model/useNoteSelect.ts'
import { Circle, ChevronDown } from '@lucide/vue'
import { resolveLucideIcon } from '@/shared/lib/lucide.ts'
import { UiCard } from '@/shared/ui'

defineOptions({
  name: 'UIExplorer',
})

const { activeFolder, setFolder, folders } = useFolderSelect()
const folderId = computed(() => activeFolder.value?.$id || '')
const { notes, setNote, activeNote } = useNoteSelect(folderId)

const iconsList = ref<Record<string, Component | null>>({})
const getIcon = (icon: string) => {
  if (icon in iconsList.value) return iconsList.value[icon]
  resolveLucideIcon(icon).then((value) => {
    iconsList.value[icon] = shallowRef(value)
  })
}

watch(
  () => folders.value,
  (items) => {
    if (!items.length) return
    items.forEach((item) => {
      getIcon(item.icon)
    })
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div>
    {{ activeFolder?.name }}
    <hr />
    <UiCard class="max-w-60">
      <div
        v-for="(folder, index) in folders"
        :key="folder.$id"
        @click="setFolder(folder)"
        class="cursor-pointer"
      >
        <div class="flex items-center">
          <ChevronDown
            class="transition"
            :class="{
              '-rotate-90': folder.$id === activeFolder?.$id,
              '': folder.$id !== activeFolder?.$id,
            }"
          />
          <div
            class="flex items-center rounded-md w-full transition"
            :class="[{ 'mt-1': index }, folder.$id === activeFolder?.$id ? folder.color : '']"
          >
            <div class="">
              <component :is="iconsList[folder.icon]" v-if="folder.icon" />
            </div>
            <span class="pl-1">
              {{ folder.name }}
            </span>
          </div>
        </div>
        <div v-if="folder.$id === activeFolder?.$id" class="pl-6">
          <div v-for="note in notes" :key="note.$id" @click="setNote(note)">
            <div class="flex items-center">
              <Circle
                :size="12"
                class="rounded-xl transition"
                :class="activeNote?.$id === note.$id ? folder.color : ''"
              />
              <span class="pl-1 truncate">{{ note.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<style scoped></style>
