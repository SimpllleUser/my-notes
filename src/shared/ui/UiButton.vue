<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'paper' | 'primary' | 'yellow' | 'blue'; size?: 'sm' | 'md'; type?: 'button' | 'submit' | 'reset' }>(), { variant: 'paper', size: 'md', type: 'button' })
</script>

<template>
  <button :type="type" class="inline-flex items-center justify-center gap-2 rounded-brutal border-2 border-ink font-black transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50" :class="[size === 'sm' ? 'min-h-8 px-3 text-sm' : 'min-h-10 px-4', { 'bg-accent-paper shadow-brutal-sm': variant === 'paper', 'bg-primary shadow-brutal-sm': variant === 'primary', 'bg-primary-yellow shadow-brutal-sm': variant === 'yellow', 'bg-secondary-blue text-white shadow-brutal-sm': variant === 'blue' }]">
    <slot />
  </button>
</template>
