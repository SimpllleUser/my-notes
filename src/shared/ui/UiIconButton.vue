<script setup lang="ts">
import { ButtonColor, ButtonSize, ButtonVariant } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    label: string
    variant?: ButtonVariant
    color?: ButtonColor
    size?: ButtonSize
  }>(),
  { variant: ButtonVariant.Flat, color: ButtonColor.Neutral, size: ButtonSize.Medium },
)
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    class="btn btn-square"
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
      },
    ]"
  >
    <slot name="icon"><slot /></slot>
  </button>
</template>
