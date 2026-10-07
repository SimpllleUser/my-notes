<script setup lang="ts">
import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { onMounted } from 'vue'

defineOptions({
  name: 'HomePage',
})

const foldersStore = useFoldersStore()

onMounted(() => {
  foldersStore.getAll()
})
</script>

<template>
  <main>
    <h1>Home</h1>
  </main>
</template>
