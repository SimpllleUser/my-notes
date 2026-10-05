<script setup lang="ts">
import { UiCard, UiStatus } from '@/shared/ui'
import { TextEditor } from '@/features/rich-text-editor'

defineProps<{ title?: string }>()
const content = defineModel<string>('content', { default: '' })
</script>

<template>
  <UiCard as="section" class="flex min-h-[620px] flex-col overflow-hidden !p-0">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b-3 border-ink px-5 py-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-ink-light">Редактор</p>
        <h2 class="text-xl font-black">{{ title }}</h2>
      </div>
      <UiStatus label="Збережено" />
    </div>
    <TextEditor v-model:content="content" class="m-4 flex-1 sm:m-6" />
  </UiCard>
</template>
