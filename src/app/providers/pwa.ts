import { useIntervalFn } from '@vueuse/core'
import { useRegisterSW } from 'virtual:pwa-register/vue'

/** Як часто перевіряти, чи вийшла нова версія, поки застосунок відкритий. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

/**
 * Реєструє service worker і повідомляє, коли після деплою з'явилась нова версія.
 * Оновлення застосовується лише за згодою користувача, щоб не втратити незбережені правки.
 */
export function useAppUpdate() {
  let registration: ServiceWorkerRegistration | undefined

  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, swRegistration) {
      registration = swRegistration
    },
  })

  useIntervalFn(() => void registration?.update(), UPDATE_CHECK_INTERVAL_MS)

  return {
    needRefresh,
    offlineReady,
    applyUpdate: () => updateServiceWorker(true),
    dismiss: () => {
      needRefresh.value = false
      offlineReady.value = false
    },
  }
}
