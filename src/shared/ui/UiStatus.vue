<script setup lang="ts">
import { Animate, ButtonSize, ComponentSize, StatusTone } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    label?: string
    size?: ComponentSize
    tone?: StatusTone
    animate?: Animate | ''
  }>(),
  {
    tone: StatusTone.Success,
    animate: '',
    size: ComponentSize.Medium,
  },
)
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <slot name="indicator" :tone="tone">
      <span
        class="status"
        :class="[
          {
            'status-neutral': tone === StatusTone.Neutral,
            'status-primary': tone === StatusTone.Primary,
            'status-secondary': tone === StatusTone.Secondary,
            'status-accent': tone === StatusTone.Accent,
            'status-info': tone === StatusTone.Info,
            'status-success': tone === StatusTone.Success,
            'status-warning': tone === StatusTone.Warning,
            'status-error': tone === StatusTone.Error,
          },
          {
            'animate-ping': animate === Animate.Ping,
            'animate-bounce': animate === Animate.Bounce,
          },
          {
            'animate-ping': animate === Animate.Ping,
            'animate-bounce': animate === Animate.Bounce,
          },
          {
            'status-xs': size === ButtonSize.ExtraSmall,
            'status-sm': size === ButtonSize.Small,
            'status-md': size === ButtonSize.Medium,
            'status-lg': size === ButtonSize.Large,
            'status-xl': size === ButtonSize.ExtraLarge,
          },
        ]"
      />
    </slot>
    <span v-if="label || $slots.default" class="badge badge-ghost">
      <slot>{{ label }}</slot>
    </span>
    <slot name="suffix" :tone="tone" />
  </span>
</template>
