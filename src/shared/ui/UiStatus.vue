<script setup lang="ts">
import { StatusTone } from '@/shared/model/enums.ts'

withDefaults(defineProps<{ label?: string; tone?: StatusTone }>(), {
  tone: StatusTone.Success,
})
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <slot name="indicator" :tone="tone">
      <span
        class="status"
        :class="{
          'status-neutral': tone === StatusTone.Neutral || tone === StatusTone.Muted,
          'status-primary': tone === StatusTone.Primary,
          'status-secondary': tone === StatusTone.Secondary,
          'status-accent': tone === StatusTone.Accent,
          'status-info': tone === StatusTone.Info,
          'status-success': tone === StatusTone.Success,
          'status-warning': tone === StatusTone.Warning,
          'status-error': tone === StatusTone.Error,
        }"
      />
    </slot>
    <span v-if="label || $slots.default" class="badge badge-ghost">
      <slot>{{ label }}</slot>
    </span>
    <slot name="suffix" :tone="tone" />
  </span>
</template>
