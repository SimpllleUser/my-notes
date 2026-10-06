<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { account } from '@/shared/api/appwrite.ts'

interface Auth {
  email: string
  password: string
}

const auth = ref<Auth>({
  email: '',
  password: '',
})

const signIn = async () => {
  try {
    const user = await account.createEmailPasswordSession({
      email: auth.value.email,
      password: auth.value.password,
    })
    console.log(user)
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  const result = await account.get()
  console.log(result)

})
</script>

<template>
  <main>
    <h1>Home</h1>
    <div class="space-y-4">
      <div>
        <input
          class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="text"
          v-model="auth.email"
        />
      </div>
      <div>
        <input
          type="text"
          class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          v-model="auth.password"
        />
      </div>
      <button
        class="w-full bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
        @click="signIn"
      >
        Sign in
      </button>
    </div>
  </main>
</template>
