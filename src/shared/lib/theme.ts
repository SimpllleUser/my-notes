import { ref, watchEffect } from 'vue'
import { ThemePalette } from '@/shared/model/enums.ts'

const STORAGE_KEY = 'my-notes:theme'

function getStoredTheme(): ThemePalette | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  return Object.values(ThemePalette).find((theme) => theme === stored) ?? null
}

function getPreferredTheme(): ThemePalette {
  return getStoredTheme() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? ThemePalette.Dark : ThemePalette.Light)
}

const theme = ref<ThemePalette>(getPreferredTheme())

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem(STORAGE_KEY, theme.value)
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === ThemePalette.Dark ? ThemePalette.Light : ThemePalette.Dark
  }

  function setTheme(value: ThemePalette) {
    theme.value = value
  }

  return { theme, toggleTheme, setTheme }
}
