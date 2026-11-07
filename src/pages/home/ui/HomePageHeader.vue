<script setup lang="ts">
import type { Folder } from '@/entities/folder'
import { UiDynamicIcon } from '@/shared/ui'

defineProps<{ folder: Folder; noteTitle: string }>()
</script>

<template>
  <div class="flex items-center min-w-0 flex-wrap py-2 px-4">
    <div class="flex justify-between items-center w-full">
      <div class="flex items-end">
        <div class="shrink-0 pr-2">
          <div :class="folder?.color" class="p-1 rounded-sm">
            <UiDynamicIcon v-if="folder?.icon" :name="folder.icon" class="text-ink" :size="30" />
          </div>
        </div>
        <div class="min-w-0 max-w-full wrap-break-word text-2xl sm:text-3xl lg:text-4xl">
          {{ folder?.name || '' }}
        </div>
        <div class="px-2 text-xl opacity-40 sm:px-4 sm:text-2xl">\</div>
        <div class="min-w-0 max-w-full wrap-break-word text-lg opacity-60 sm:text-xl lg:text-2xl">
          {{ noteTitle }}
        </div>
      </div>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<style scoped></style>
