<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UIInputField, UiModal } from '@/shared/ui'
import { ComponentSize } from '@/shared/model/enums.ts'
import { FileEntityTypes } from '@/entities/folder/model/types.ts'
import type { Nullable } from '@/shared/model/types.ts'

const props = withDefaults(
  defineProps<{
    type: Nullable<FileEntityTypes>
    value?: string
  }>(),
  {
    type: null,
    value: '',
  },
)

const fileName = ref('')
const modal = defineModel<boolean>()
const emits = defineEmits<{
  save: [paload: { name: string; type: FileEntityTypes }]
}>()

const submitted = ref(false)

const modalTitle = computed(() => {
  if (!props.type) return ''
  return {
    [FileEntityTypes.File]: 'Create file',
    [FileEntityTypes.Folder]: 'Create folder',
  }[props.type]
})

watch(
  () => modal.value,
  (isOpen) => {
    if (isOpen) fileName.value = props.value || ''
    submitted.value = false
  },
)

const isEmptyValue = computed(() => !fileName.value.trim().length)

const save = () => {
  submitted.value = true
  if (isEmptyValue.value) return
  emits('save', {
    name: fileName.value,
    type: props.type!,
  })
}
</script>

<template>
  <UiModal
    v-model:open="modal"
    :showCloseButton="false"
    boxClass="py-0"
    :size="ComponentSize.Small"
  >
    <template #body>
      <div class="px-1">
        <form @submit.prevent="save">
          <span class="text-xs"> {{ modalTitle }} </span>
          <!--          :class="{ 'border-1 border-error': isEmptyValue && submitted, }"-->
          <UIInputField
            v-model="fileName"
            :size="ComponentSize.ExtraSmall"
            :invalid="submitted && isEmptyValue"
          >
            <template #error>
              <span class="text-error">Is empty</span>
            </template>
          </UIInputField>
        </form>
      </div>
    </template>
  </UiModal>
</template>

<style scoped></style>
