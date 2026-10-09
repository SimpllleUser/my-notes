<script setup lang="ts">
import { ButtonVariant } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: 'sm' | 'md'
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { variant: ButtonVariant.Paper, size: 'md', type: 'button' },
)
</script>

<template>
  <button
    :type="type"
    class="inline-flex items-center justify-center gap-2 rounded-brutal border-2 border-ink font-black transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50"
    :class="[
      size === 'sm' ? 'min-h-10 px-3 text-sm sm:min-h-8' : 'min-h-11 px-3 sm:min-h-10 sm:px-4',
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
