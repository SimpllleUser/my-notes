<script setup lang="ts">
import { AuthForm } from '@/entities/auth'
</script>

<template>
  <div>
    <div class="fixed inset-0 z-10 bg-ink/40" />
    <main class="relative z-20 flex items-center justify-center h-screen pb-20">
      <AuthForm />
    </main>
  </div>
</template>
