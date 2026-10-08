<script setup lang="ts">
import type { Folder } from '@/entities/folder'
import { reactive } from 'vue'
import { UiButton, UIInputField } from '@/shared/ui'
import { IconPicker } from '@/features/icon-picker'
import { ColorPicker } from '@/features/color-picker'
import type { FolderPayload } from '@/entities/folder/model/types.ts'

defineOptions({
  name: 'FolderForm',
})

const props = defineProps<{
  folder?: Folder
}>()

const form = reactive<Folder | FolderPayload>(
  props.folder ?? {
    name: '',
    color: '',
    icon: '',
  },
)

const emits = defineEmits<{
  submit: [payload: Folder | FolderPayload]
}>()

const submit = () => {
  emits('submit', form)
  form.name = ''
}
</script>

<template>
  <div class="flex justify-center gap-3 pb-6">
    <UIInputField v-model="form.name" placeholder="Create some folder" />
    <ColorPicker v-model="form.color" label="Колір папки" auto-init>
      <template #trigger="{ toggle, value }">
        <UiButton @click="toggle">
          <span class="h-4 w-4 rounded border-2 border-ink" :class="value ?? 'bg-bg'" />
        </UiButton>
      </template>
    </ColorPicker>
    <IconPicker v-model="form.icon" auto-init>
      <template #trigger="{ toggle, icon: Icon }">
        <UiButton @click="toggle">
          <component :is="Icon" :size="16" />
        </UiButton>
      </template>
    </IconPicker>
    <UiButton @click="submit"> Create </UiButton>
  </div>
</template>

<style scoped></style>
