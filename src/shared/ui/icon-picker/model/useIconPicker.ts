import { computed, ref, shallowRef, type Component } from 'vue'
import { loadLucideIcons } from '@/shared/lib/lucide'
import { getRandomArrayItem } from '@/shared/utils/arrays.ts'

const RESULTS_LIMIT = 60

function toSearchableLabel(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

export function useIconPicker() {
  const query = ref('')
  const loading = ref(false)
  const allIcons = shallowRef<Record<string, Component> | null>(null)
  let loadPromise: Promise<Record<string, Component>> | null = null

  function ensureLoaded() {
    if (!loadPromise) {
      loading.value = true
      loadPromise = loadLucideIcons().then((icons) => {
        allIcons.value = icons
        loading.value = false
        return icons
      })
    }
    return loadPromise
  }

  const results = computed(() => {
    if (!allIcons.value) return []
    const icons = allIcons.value
    const normalizedQuery = query.value.trim().toLowerCase()
    const names = Object.keys(icons)
    const filtered = normalizedQuery
      ? names.filter((name) => toSearchableLabel(name).toLowerCase().includes(normalizedQuery))
      : names
    return filtered.slice(0, RESULTS_LIMIT).map((name) => ({ name, component: icons[name]! }))
  })

  async function getRandomIcon() {
    const icons = await ensureLoaded()
    const name = getRandomArrayItem(Object.keys(icons))
    return { name, component: icons[name]! }
  }

  return { query, results, loading, ensureLoaded, getRandomIcon }
}
