<script setup lang="ts">
import { UiCard, UiButton, UIInputField } from '@/shared/ui'
import { reactive } from 'vue'

const form = reactive({
  email: '',
  password: '',
})
</script>

<template>
  <UiCard class="w-100">
    <h2 class="text-xl font-black sm:text-2xl pb-2">Auth</h2>
    <div class="body grid gap-4">
      <UIInputField v-model="form.email" placeholder="Email" type="email" />
      <UIInputField v-model="form.password" placeholder="Password" type="password" />
    </div>
    <div class="flex justify-end pt-2">
      <UiButton label="Sign in" variant="blue">Sing in</UiButton>
    </div>
  </UiCard>
</template>

<style scoped></style>
