<script setup lang="ts">
import { LoadingColor, LoadingSize, LoadingVariant } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    variant?: LoadingVariant
    size?: LoadingSize
    color?: LoadingColor
    label?: string
  }>(),
  {
    variant: LoadingVariant.Spinner,
    size: LoadingSize.Medium,
    label: '',
  },
)
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <span
      role="status"
      aria-live="polite"
      :aria-label="label || 'Loading'"
      class="loading"
      :class="[
        {
          'loading-spinner': variant === LoadingVariant.Spinner,
          'loading-dots': variant === LoadingVariant.Dots,
          'loading-ring': variant === LoadingVariant.Ring,
          'loading-ball': variant === LoadingVariant.Ball,
          'loading-bars': variant === LoadingVariant.Bars,
          'loading-infinity': variant === LoadingVariant.Infinity,
          'loading-xs': size === LoadingSize.ExtraSmall,
          'loading-sm': size === LoadingSize.Small,
          'loading-md': size === LoadingSize.Medium,
          'loading-lg': size === LoadingSize.Large,
          'loading-xl': size === LoadingSize.ExtraLarge,
          'text-neutral': color === LoadingColor.Neutral,
          'text-primary': color === LoadingColor.Primary,
          'text-secondary': color === LoadingColor.Secondary,
          'text-accent': color === LoadingColor.Accent,
          'text-info': color === LoadingColor.Info,
          'text-success': color === LoadingColor.Success,
          'text-warning': color === LoadingColor.Warning,
          'text-error': color === LoadingColor.Error,
        },
      ]"
    />
    <span v-if="label || $slots.default"
      ><slot>{{ label }}</slot></span
    >
  </span>
</template>
