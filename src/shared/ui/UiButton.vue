<script setup lang="ts">
import { ButtonColor, ButtonSize, ButtonType, ButtonVariant } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    color?: ButtonColor
    size?: ButtonSize
    type?: ButtonType
    active?: boolean
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    variant: ButtonVariant.Flat,
    color: ButtonColor.Neutral,
    size: ButtonSize.Medium,
    type: ButtonType.Button,
    active: false,
    loading: false,
    disabled: false,
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="btn"
    :class="[
      {
        'btn-xs': size === ButtonSize.ExtraSmall,
        'btn-sm': size === ButtonSize.Small,
        'btn-md': size === ButtonSize.Medium,
        'btn-lg': size === ButtonSize.Large,
        'btn-xl': size === ButtonSize.ExtraLarge,
      },
      {
        'btn-outline': variant === ButtonVariant.Outlined,
        'btn-dash': variant === ButtonVariant.Dash,
        'btn-ghost': variant === ButtonVariant.Ghost,
        'btn-soft': variant === ButtonVariant.Soft,
        'btn-link': variant === ButtonVariant.Link,
        'btn-neutral': color === ButtonColor.Neutral,
        'btn-primary': color === ButtonColor.Primary,
        'btn-secondary': color === ButtonColor.Secondary,
        'btn-accent': color === ButtonColor.Accent,
        'btn-info': color === ButtonColor.Info,
        'btn-success': color === ButtonColor.Success,
        'btn-warning': color === ButtonColor.Warning,
        'btn-error': color === ButtonColor.Error,
        'btn-active': active,
      },
    ]"
  >
    <span v-if="loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
    <slot name="prefix" />
    <slot />
    <slot name="suffix" />
  </button>
</template>
