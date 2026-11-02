<script setup lang="ts">
import { UiCard, UiButton, UIInputField, UiPopover } from '@/shared/ui'
import { reactive, ref } from 'vue'
import { type SingInPayload, useAuthStore } from '@/entities/auth'
import { ButtonColor, InputType, PopoverLocation } from '@/shared/model/enums.ts'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive<SingInPayload>({
  email: '',
  password: '',
})

const authStore = useAuthStore()

defineEmits<{
  submit: (payload: SingInPayload) => void
}>()

const isInvalid = ref(false)

const submit = async (payload: SingInPayload) => {
  await authStore.signIn(payload)
  if (authStore.isAuthed) {
    form.email = ''
    form.password = ''
    router.push({ name: 'home' })
    return
  }

  isInvalid.value = true
}
</script>

<template>
  <UiCard class="w-100">
    <UiPopover :model-value="isInvalid" :location="PopoverLocation.Top">
      <div class="w-80 text-primary">Some problem with auth</div>
    </UiPopover>
    <h2 class="text-xl font-black sm:text-2xl pb-2">Auth</h2>
    <div class="body grid gap-4">
      <UIInputField v-model="form.email" placeholder="Email" :type="InputType.Email" />
      <UIInputField v-model="form.password" placeholder="Password" :type="InputType.Password" />
    </div>
    <div class="flex justify-end pt-2">
      <UiButton label="Sign in" :color="ButtonColor.Info" @click="submit(form)">Sing in</UiButton>
    </div>
  </UiCard>
</template>

<style scoped></style>
