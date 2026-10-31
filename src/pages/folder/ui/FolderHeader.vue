<script setup lang="ts">
defineOptions({
  name: 'FolderHeader',
})

import { useRouter } from 'vue-router'
import { UiCard } from '@/shared/ui'
import { Slash } from '@lucide/vue'
import Logo from '../../../../public/logo.svg?url'
import { FolderSelectSlider } from '@/entities/folder'
import { FolderSelectPicker } from '@/entities/folder'

const router = useRouter()

const goToHome = () => router.push({ name: 'home' })
</script>

<template>
  <header class="flex w-full flex-col gap-4">
    <UiCard compact>
      <div class="flex items-center gap-4">
        <div
          class="app-logo cursor-pointer grid h-11 w-11 place-items-center rounded-brutal text-xl"
          @click="goToHome"
        >
          <img :src="Logo" alt="logo" width="44" height="44" />
        </div>
        <span>
          <Slash :size="12" />
        </span>
        <FolderSelectPicker v-if="false" />
        <FolderSelectSlider />
      </div>
    </UiCard>
  </header>
</template>

<style lang="scss">
.app-logo {
  transition: 0.4s all ease-in-out;
  transform: rotate(360deg);
}
.app-logo:hover {
  transition: 0.4s all ease-in-out;
  font-size: 1.75rem;
  transform: rotate(180deg);
}
</style>
