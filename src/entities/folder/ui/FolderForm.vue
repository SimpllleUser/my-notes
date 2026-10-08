<script setup lang="ts">
import type { Folder } from '@/entities/folder'
import { ref, watch } from 'vue'
import { UiButton, UIInputField } from '@/shared/ui'
import { IconPicker } from '@/features/icon-picker'
import { ColorPicker } from '@/features/color-picker'
import type { FolderPayload } from '@/entities/folder/model/types.ts'
import type { Nullable } from '@/shared/model/types.ts'

defineOptions({
  name: 'FolderForm',
})

const props = defineProps<{
  folder: Nullable<Folder>
}>()

const form = ref<Folder | FolderPayload>(
  props.folder ?? {
    name: '',
    color: '',
    icon: '',
  },
)

watch(
  () => props.folder,
  (value) => {
    if (!value) return
    form.value = { ...value }
  },
)

const emits = defineEmits<{
  submit: [payload: Folder | FolderPayload]
}>()

const submit = () => {
  emits('submit', { ...form.value })
  if (!props.folder) {
    form.value.name = ''
  }
}

const reset = () => {
  form.value = props.folder
    ? {
        ...props.folder,
      }
    : {
        name: '',
        icon: '',
        color: '',
      }
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
    <UiButton @click="submit"> {{ folder ? 'Save' : 'Create' }} </UiButton>
    <UiButton @click="reset"> Reset </UiButton>
  </div>
</template>

<style scoped></style>
