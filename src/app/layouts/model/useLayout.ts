import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const layouts = {
  DefaultLayout: defineAsyncComponent(() => import('../ui/DefaultLayout.vue')),
  EmptyLayout: defineAsyncComponent(() => import('../ui/EmptyLayout.vue')),
}

type LayoutName = keyof typeof layouts

const isLayoutName = (value: unknown): value is LayoutName =>
  typeof value === 'string' && value in layouts

export function useLayout() {
  const route = useRoute()
  const layout = computed(() =>
    isLayoutName(route.meta.layout) ? layouts[route.meta.layout] : layouts.DefaultLayout,
  )

  return { layout }
}
