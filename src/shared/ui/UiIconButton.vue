<script setup lang="ts">
import { ButtonVariant } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    label: string
    variant?: ButtonVariant
    size?: 'sm' | 'md'
  }>(),
  { variant: ButtonVariant.Paper, size: 'md' },
)
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    class="grid place-items-center rounded-brutal border-2 border-ink font-black transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50"
    :class="[
      size === 'sm' ? 'h-10 w-10 text-lg sm:h-8 sm:w-8' : 'h-11 w-11 text-xl sm:h-10 sm:w-10',
      {
        'bg-accent-paper shadow-brutal-sm': variant === ButtonVariant.Paper,
        'bg-primary shadow-brutal-sm': variant === ButtonVariant.Primary,
        'bg-primary-yellow shadow-brutal-sm': variant === ButtonVariant.Yellow,
        'bg-secondary-blue text-white shadow-brutal-sm': variant === ButtonVariant.Blue,
      },
    ]"
  >
    <slot />
  </button>
</template>
