<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { UiButton, UiCard } from '@/shared/ui'
import { Slash } from '@lucide/vue'
import { ButtonVariant } from '@/shared/model/enums.ts'

defineOptions({
  name: 'NoteLayout',
})

const route = useRoute()
const router = useRouter()

const folderName = computed(() => route.params?.name || '')
const goToHome = () => router.push({ name: 'home' })
</script>

<template>
  <main>
    <header class="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 px-8 pt-4">
      <UiCard compact>
        <div class="flex items-center gap-4">
          <div
            class="app-logo cursor-pointer grid h-11 w-11 place-items-center rounded-brutal border-3 border-ink bg-paper text-xl"
            @click="goToHome"
          >
            ✦
          </div>
          <span>
            <Slash :size="12" />
          </span>
          <span class="text-lg font-black sm:text-xl cursor-default">{{ folderName }}</span>
        </div>
      </UiCard>
    </header>
    <div class="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col pt-4">
      <slot />
    </div>
  </main>
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
