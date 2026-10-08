<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder?: string
    type?: 'text' | 'password' | 'email'
    disabled?: boolean
  }>(),
  { type: 'text', placeholder: '', disabled: false },
)

const value = defineModel<string>({ default: '' })
</script>

<template>
  <label
    class="flex items-center rounded-brutal border-2 border-ink px-3 py-2 text-base transition duration-150 hover:shadow-brutal focus-within:bg-accent-paper focus-within:shadow-brutal has-disabled:pointer-events-none has-disabled:opacity-50 sm:text-sm"
  >
    <input
      v-model="value"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      autofocus
      class="w-full bg-transparent outline-none placeholder:font-normal placeholder:text-ink-light disabled:cursor-not-allowed"
    />
  </label>
</template>
