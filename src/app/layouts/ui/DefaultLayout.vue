<script setup lang="ts">
import { ThemeSwitcher } from '@/features/theme-switcher'

defineOptions({
  name: 'DefaultLayout',
})
</script>

<template>
  <main class="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col pt-4">
    <header class="flex justify-end px-6 pb-3 md:px-8">
      <ThemeSwitcher />
    </header>
    <slot />
  </main>
</template>
