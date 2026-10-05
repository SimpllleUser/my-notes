<script setup lang="ts">
withDefaults(defineProps<{ label: string; variant?: 'paper' | 'primary' | 'yellow'; size?: 'sm' | 'md' }>(), { variant: 'paper', size: 'md' })
</script>

<template>
  <button type="button" :aria-label="label" :title="label" class="grid place-items-center rounded-brutal border-2 border-ink font-black transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50" :class="[size === 'sm' ? 'h-8 w-8 text-lg' : 'h-10 w-10 text-xl', { 'bg-accent-paper shadow-brutal-sm': variant === 'paper', 'bg-primary shadow-brutal-sm': variant === 'primary', 'bg-primary-yellow shadow-brutal-sm': variant === 'yellow' }]">
    <slot />
  </button>
</template>
