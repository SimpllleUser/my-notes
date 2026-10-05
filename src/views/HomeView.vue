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
  <main class="p-6">
    <div class="max-w-sm mx-auto rounded-xl bg-white p-6 shadow-md">
      <h1 class="text-xl font-medium text-black">Перевірка Appwrite</h1>
      <p class="mt-2 text-gray-500">Натисніть кнопку, щоб виконати пробний запит.</p>

      <button
        class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        :disabled="loading"
        @click="testAppwrite"
      >
        {{ loading ? 'Перевіряю...' : 'Перевірити Appwrite' }}
      </button>

      <p v-if="result" class="mt-4 text-sm text-gray-700">{{ result }}</p>
    </div>
  </main>
</template>
