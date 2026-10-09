<script lang="ts" setup>
import { useLayout } from '@/app/layouts/model/useLayout.ts'

const {layout} = useLayout()
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
</template>
