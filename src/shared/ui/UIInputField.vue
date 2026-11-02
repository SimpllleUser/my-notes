<script setup lang="ts">
import { InputSize, InputType } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    placeholder?: string
    type?: InputType
    size?: InputSize
    label?: string
    helperText?: string
    errorText?: string
    invalid?: boolean
    disabled?: boolean
    autofocus?: boolean
  }>(),
  {
    type: InputType.Text,
    size: InputSize.Medium,
    placeholder: '',
    helperText: '',
    errorText: '',
    invalid: false,
    disabled: false,
    autofocus: false,
  },
)

const value = defineModel<string>({ default: '' })
</script>

<template>
  <fieldset class="fieldset w-full">
    <legend v-if="label || $slots.label" class="fieldset-legend">
      <slot name="label">{{ label }}</slot>
    </legend>
    <label
      class="input w-full"
      :class="{
        'input-xs': size === InputSize.ExtraSmall,
        'input-sm': size === InputSize.Small,
        'input-md': size === InputSize.Medium,
        'input-lg': size === InputSize.Large,
        'input-xl': size === InputSize.ExtraLarge,
        'input-error': invalid,
      }"
    >
      <slot name="prefix" />
      <input
        v-model="value"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autofocus="autofocus"
        class="grow"
      />
      <slot name="suffix" />
    </label>
    <p v-if="invalid && (errorText || $slots.error)" class="label text-error">
      <slot name="error">{{ errorText }}</slot>
    </p>
    <p v-else-if="helperText || $slots.helper" class="label">
      <slot name="helper">{{ helperText }}</slot>
    </p>
  </fieldset>
</template>
