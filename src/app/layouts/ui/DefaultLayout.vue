<script setup lang="ts">
import { ThemeSwitcher } from '@/features/theme-switcher'

defineOptions({
  name: 'DefaultLayout',
})
</script>

<template>
  <main class="">
    <header class="flex justify-end py-3 px-8">
      <ThemeSwitcher />
    </header>
    <slot />
  </main>
</template>
