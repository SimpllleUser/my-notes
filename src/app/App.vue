<script lang="ts" setup>
import { useLayout } from '@/app/layouts/model/useLayout.ts'
import UiModal from '@/shared/ui/modal/UiModal.vue'

const {layout} = useLayout()
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  <UiModal global />
</template>
