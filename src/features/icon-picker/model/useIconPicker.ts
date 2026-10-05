import { computed, ref, shallowRef, type Component } from 'vue'
import { loadLucideIcons } from '@/shared/lib/lucide'

const RESULTS_LIMIT = 60

function toSearchableLabel(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

export function useIconPicker() {
  const query = ref('')
  const loading = ref(false)
  const allIcons = shallowRef<Record<string, Component> | null>(null)

  async function ensureLoaded() {
    if (allIcons.value || loading.value) return
    loading.value = true
    allIcons.value = await loadLucideIcons()
    loading.value = false
  }

  const results = computed(() => {
    if (!allIcons.value) return []
    const icons = allIcons.value
    const normalizedQuery = query.value.trim().toLowerCase()
    const names = Object.keys(icons)
    const filtered = normalizedQuery ? names.filter((name) => toSearchableLabel(name).toLowerCase().includes(normalizedQuery)) : names
    return filtered.slice(0, RESULTS_LIMIT).map((name) => ({ name, component: icons[name]! }))
  })

  return { query, results, loading, ensureLoaded }
}
