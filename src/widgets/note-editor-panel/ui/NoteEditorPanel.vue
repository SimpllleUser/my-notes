<script setup lang="ts">
import type { Content } from '@tiptap/vue-3'
import { UiCard, UiStatus } from '@/shared/ui'
import { TextEditor } from '@/features/rich-text-editor'

defineProps<{ title?: string }>()
const content = defineModel<Content>('content', { default: '' })
</script>

<template>
  <UiCard
    as="section"
    class="flex min-h-[480px] sm:min-h-[620px] min-w-0 flex-col overflow-hidden !p-0"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b-3 border-ink px-4 py-3 sm:px-5 sm:py-4"
    >
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Редактор</p>
        <h2 class="break-words text-lg font-black sm:text-xl">{{ title }}</h2>
      </div>
      <UiStatus label="Збережено" />
    </div>
    <TextEditor v-model:content="content" class="m-3 flex-1 sm:m-6" />
  </UiCard>
</template>
