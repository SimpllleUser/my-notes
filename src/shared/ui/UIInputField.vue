<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    type?: 'text' | 'password' | 'email'
  }>(),
  {
    type: 'text',
    placeholder: '',
  },
)

const emits = defineEmits(['update:modelValue'])

const internalValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emits('update:modelValue', value)
  },
})
</script>

<template>
  <label
    class="mb-2 flex items-center gap-2 rounded-brutal border-2 border-ink bg-bg px-3 py-2 focus-within:bg-white"
  >
    <input
      v-model="internalValue"
      :type="type"
      autofocus
      :placeholder="placeholder"
      class="text-sm font-black w-full bg-transparent outline-none placeholder:text-opacity-50"
    />
  </label>
</template>

<style scoped></style>
