<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const result = ref('')

async function testAppwrite() {
  loading.value = true
  result.value = ''

  try {
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
    const response = await fetch(`${endpoint}/health/version`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    result.value = `Appwrite працює. Версія: ${data.version}`
  } catch (error) {
    result.value = `Помилка підключення: ${error instanceof Error ? error.message : 'невідома помилка'}`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-bg p-6 text-ink">
    <div class="mx-auto max-w-sm rounded-brutal-lg border-3 border-ink bg-accent-paper p-6 shadow-brutal">
      <h1 class="text-xl font-bold">Перевірка Appwrite</h1>
      <p class="mt-2 text-ink-light">Натисніть кнопку, щоб виконати пробний запит.</p>

      <button
        class="mt-4 rounded-brutal border-3 border-ink bg-primary px-4 py-2 font-bold text-ink shadow-brutal-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="loading"
        @click="testAppwrite"
      >
        {{ loading ? 'Перевіряю...' : 'Перевірити Appwrite' }}
      </button>

      <p v-if="result" class="mt-4 text-sm text-ink-light">{{ result }}</p>
    </div>
  </main>
</template>
