<script setup lang="ts">
import { Search } from '@lucide/vue'
import { InputSize } from '@/shared/model/enums.ts'

withDefaults(defineProps<{ placeholder?: string; size?: InputSize }>(), {
  placeholder: '',
  size: InputSize.Medium,
})
const value = defineModel<string>({ default: '' })
</script>

<template>
  <label
    class="input flex w-full items-center gap-2"
    :class="{
      'input-xs': size === InputSize.ExtraSmall,
      'input-sm': size === InputSize.Small,
      'input-md': size === InputSize.Medium,
      'input-lg': size === InputSize.Large,
      'input-xl': size === InputSize.ExtraLarge,
    }"
  >
    <slot name="prefix">
      <Search :size="16" class="opacity-70" aria-hidden="true" />
    </slot>
    <input v-model="value" class="grow" :placeholder="placeholder" type="search" />
    <slot name="suffix" />
  </label>
</template>
