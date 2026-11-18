<script setup lang="ts">
import { computed } from 'vue'
import { ButtonColor, ComponentSize } from '@/shared/model/enums.ts'
import { UiButton } from '@/shared/ui'
import { useAppUpdate } from '@/app/providers/pwa'

const { needRefresh, offlineReady, applyUpdate, dismiss } = useAppUpdate()
const visible = computed(() => needRefresh.value || offlineReady.value)
</script>

<template>
  <div v-if="visible" class="toast toast-end z-50" role="status">
    <div class="alert alert-info flex items-center gap-3 py-2 text-sm">
      <span>{{ needRefresh ? 'Доступна нова версія застосунку' : 'Застосунок готовий працювати офлайн' }}</span>
      <UiButton
        v-if="needRefresh"
        :size="ComponentSize.ExtraSmall"
        :color="ButtonColor.Primary"
        @click="applyUpdate"
      >
        Оновити
      </UiButton>
      <UiButton :size="ComponentSize.ExtraSmall" @click="dismiss">Закрити</UiButton>
    </div>
  </div>
</template>
