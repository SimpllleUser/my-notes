<script setup lang="ts">
defineOptions({
  name: 'DefaultLayout',
})
</script>

<template>
  <main class="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col pt-4">
    <slot />
  </main>
</template>

<style scoped></style>
