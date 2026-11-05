<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FileEntityTypes } from '@/entities/folder'
import { ColorPicker } from '@/features/color-picker'
import { IconPicker } from '@/features/icon-picker'
import {
  ButtonColor,
  ButtonType,
  ButtonVariant,
  ComponentSize,
  FolderColor,
  PopoverLocation,
} from '@/shared/model/enums.ts'
import { UIInputField, UiButton, UiModal } from '@/shared/ui'
import { ExplorerFormMode } from '../model/types'
import type { ExplorerCreatePayload } from '../model/types'

const props = withDefaults(
  defineProps<{
    type: FileEntityTypes | null
    mode?: ExplorerFormMode
    initialValue?: { name: string; color?: string; icon?: string }
    saving?: boolean
    error?: string
  }>(),
  { type: null, mode: ExplorerFormMode.Create, initialValue: undefined, saving: false, error: '' },
)

const emit = defineEmits<{ save: [payload: ExplorerCreatePayload] }>()
const isOpen = defineModel<boolean>()
const name = ref('')
const color = ref<string>(FolderColor.Primary)
const icon = ref('Folder')
const submitted = ref(false)

const title = computed(() => {
  const action = props.mode === ExplorerFormMode.Edit ? 'Edit' : 'Create'
  if (props.type === FileEntityTypes.File) return `${action} note`
  if (props.type === FileEntityTypes.Folder) return `${action} folder`
  return ''
})
const isNameEmpty = computed(() => !name.value.trim())

watch(isOpen, (open) => {
  submitted.value = false
  if (!open) return
  name.value = props.initialValue?.name ?? ''
  color.value = props.initialValue?.color ?? FolderColor.Primary
  icon.value = props.initialValue?.icon ?? 'Folder'
})

function save() {
  submitted.value = true
  if (isNameEmpty.value || !props.type || props.saving) return

  emit('save', {
    name: name.value.trim(),
    type: props.type,
    color: color.value,
    icon: icon.value,
  })
}
</script>

<template>
  <UiModal
    v-model:open="isOpen"
    boxClass="!p-3 !overflow-visible"
    bodyClass="!py-2"
    titleClass="text-sm font-semibold"
    :size="ComponentSize.Small"
  >
    <template #title>{{ title }}</template>
    <template #body>
      <form class="flex flex-col gap-2" @submit.prevent="save">
        <div class="flex items-center gap-1.5">
          <UIInputField
            v-model="name"
            :size="ComponentSize.ExtraSmall"
            :invalid="submitted && isNameEmpty"
            class="min-w-0 flex-1"
          >
            <template #error><span class="text-error">Is empty</span></template>
          </UIInputField>
          <div v-if="type === FileEntityTypes.Folder" class="flex shrink-0 items-center gap-1">
            <ColorPicker
              v-model="color"
              label="Folder color"
              compact
              :location="PopoverLocation.LeftCenter"
            >
              <template #trigger="{ toggle, value }">
                <UiButton
                  :size="ComponentSize.ExtraSmall"
                  :variant="ButtonVariant.Ghost"
                  aria-label="Choose folder color"
                  title="Choose folder color"
                  @click="toggle"
                >
                  <span class="size-3.5 rounded-full border border-base-content/20" :class="value" />
                </UiButton>
              </template>
            </ColorPicker>
            <IconPicker v-model="icon" label="Folder icon">
              <template #trigger="{ toggle, icon: SelectedIcon }">
                <UiButton
                  :size="ComponentSize.ExtraSmall"
                  :variant="ButtonVariant.Ghost"
                  aria-label="Choose folder icon"
                  title="Choose folder icon"
                  @click="toggle"
                >
                  <component :is="SelectedIcon" v-if="SelectedIcon" :size="14" />
                </UiButton>
              </template>
            </IconPicker>
          </div>
        </div>
        <div class="flex min-h-8 items-center justify-between gap-2">
          <span v-if="error" class="text-xs text-error">{{ error }}</span>
          <UiButton
            :type="ButtonType.Submit"
            :size="ComponentSize.ExtraSmall"
            :color="ButtonColor.Primary"
            :loading="saving"
            class="ml-auto min-h-0 px-3 text-xs"
          >
            {{ mode === ExplorerFormMode.Edit ? 'Save' : 'Create' }}
          </UiButton>
        </div>
      </form>
    </template>
  </UiModal>
</template>
