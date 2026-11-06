<script setup lang="ts">
import { ButtonColor, ComponentSize } from '@/shared/model/enums.ts'
import { UiButton, UiModal } from '@/shared/ui'
import { FileEntityTypes } from '../model/types'

withDefaults(
  defineProps<{
    name: string
    type: FileEntityTypes | null
    deleting?: boolean
    error?: string
  }>(),
  { deleting: false, error: '' },
)

const emit = defineEmits<{ confirm: [] }>()
const isOpen = defineModel<boolean>('open', { required: true })
</script>

<template>
  <UiModal v-model:open="isOpen" boxClass="!p-3" bodyClass="!py-2" :size="ComponentSize.Small">
    <template #title>
      <span class="text-sm font-semibold">Delete {{ type === FileEntityTypes.Folder ? 'folder' : 'note' }}?</span>
    </template>
    <template #body>
      <div class="flex flex-col gap-3">
        <p class="text-sm">
          Delete <strong>{{ name }}</strong>? This action cannot be undone.
          <template v-if="type === FileEntityTypes.Folder">
            Notes inside this folder will also be deleted.
          </template>
        </p>
        <span v-if="error" class="text-xs text-error">{{ error }}</span>
        <div class="flex justify-end gap-2">
          <UiButton :size="ComponentSize.ExtraSmall" :disabled="deleting" @click="isOpen = false">
            Cancel
          </UiButton>
          <UiButton
            :size="ComponentSize.ExtraSmall"
            :color="ButtonColor.Error"
            :loading="deleting"
            @click="emit('confirm')"
          >
            Delete
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>
