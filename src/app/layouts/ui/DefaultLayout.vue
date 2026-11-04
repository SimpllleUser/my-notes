<script setup lang="ts">
import { ThemeSwitcher } from '@/features/theme-switcher'
import { AppLogo, UiDivider } from '@/shared/ui'
import { ref } from 'vue'

defineOptions({
  name: 'DefaultLayout',
})

const PRIMARY_COLOR_KEY = '--color-primary'

const getPrimaryColor = () =>
  window.getComputedStyle(document.body).getPropertyValue(PRIMARY_COLOR_KEY)

const color = ref(getPrimaryColor())

const changeColor = () => {
  color.value = getPrimaryColor()
}
</script>

<template>
  <main class="">
    <header class="flex justify-between py-2 px-4 bg-base-300">
      <AppLogo width="44" height="44" :color="color" :key="color" />
      <ThemeSwitcher @select="changeColor" />
    </header>
    <UiDivider class="p-0 m-0 h-1" />
    <slot />
  </main>
</template>
