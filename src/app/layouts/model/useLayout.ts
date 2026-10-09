import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

export function useLayout() {
  const layouts = {
    DefaultLayout: defineAsyncComponent(() => import('../ui/DefaultLayout.vue')),
    EmptyLayout: defineAsyncComponent(() => import('../ui/EmptyLayout.vue')),
  }

  const route = useRoute()
  const layout = computed(() => {
    const layoutName = route.meta.layout
    if (layoutName && layoutName in layouts) {
      return layouts[layoutName]
    }
    return layouts.DefaultLayout
  })

  return {
    layout,
  }
}
