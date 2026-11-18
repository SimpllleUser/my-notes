<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ButtonColor, ButtonType, ComponentSize } from '@/shared/model/enums.ts'
import { UIInputField, UiButton, UiModal } from '@/shared/ui'

const props = withDefaults(
  defineProps<{ importing: boolean; error: string; title?: string; askName?: boolean }>(),
  { title: 'Імпорт нотатки', askName: true },
)
const emit = defineEmits<{ import: [name: string, json: string] }>()

const isOpen = defineModel<boolean>()
const name = ref('')
const json = ref('')
const submitted = ref(false)

const isNameMissing = computed(() => props.askName && !name.value.trim())
const isInvalid = computed(() => isNameMissing.value || !json.value.trim())

watch(isOpen, (open) => {
  if (!open) return
  name.value = ''
  json.value = ''
  submitted.value = false
})

async function loadFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  json.value = await file.text()
  name.value ||= file.name.replace(/\.[^.]+$/, '')
}

function submit() {
  submitted.value = true
  if (isInvalid.value || props.importing) return
  emit('import', name.value.trim(), json.value)
}
</script>

<template>
  <UiModal
    v-model:open="isOpen"
    boxClass="!p-3"
    bodyClass="!py-2"
    titleClass="text-sm font-semibold"
    :size="ComponentSize.Small"
  >
    <template #title>{{ title }}</template>
    <template #body>
      <form class="flex flex-col gap-2" @submit.prevent="submit">
        <UIInputField
          v-if="askName"
          v-model="name"
          placeholder="Назва нотатки"
          :size="ComponentSize.ExtraSmall"
          :invalid="submitted && isNameMissing"
        />
        <textarea
          v-model="json"
          class="textarea textarea-xs h-48 w-full font-mono"
          :class="{ 'textarea-error': submitted && !json.trim() }"
          placeholder="Вставте JSON з блоками…"
          spellcheck="false"
        />
        <input
          type="file"
          accept=".json,application/json"
          class="file-input file-input-xs w-full"
          @change="loadFile"
        />
        <div class="flex min-h-8 items-center justify-between gap-2">
          <span v-if="error" class="text-xs text-error">{{ error }}</span>
          <UiButton
            :type="ButtonType.Submit"
            :size="ComponentSize.ExtraSmall"
            :color="ButtonColor.Primary"
            :loading="importing"
            class="ml-auto min-h-0 px-3 text-xs"
          >
            Імпортувати
          </UiButton>
        </div>
      </form>
    </template>
  </UiModal>
</template>
