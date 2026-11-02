<script setup lang="ts">
import { DividerColor, DividerDirection, DividerPlacement } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    direction?: DividerDirection
    color?: DividerColor
    placement?: DividerPlacement
  }>(),
  { direction: DividerDirection.Vertical },
)
</script>

<template>
  <div
    role="separator"
    :aria-orientation="direction === DividerDirection.Horizontal ? 'vertical' : 'horizontal'"
    class="divider"
    :class="[
      {
        'divider-horizontal': direction === DividerDirection.Horizontal,
        'divider-start': placement === DividerPlacement.Start,
        'divider-end': placement === DividerPlacement.End,
        'divider-neutral': color === DividerColor.Neutral,
        'divider-primary': color === DividerColor.Primary,
        'divider-secondary': color === DividerColor.Secondary,
        'divider-accent': color === DividerColor.Accent,
        'divider-info': color === DividerColor.Info,
        'divider-success': color === DividerColor.Success,
        'divider-warning': color === DividerColor.Warning,
        'divider-error': color === DividerColor.Error,
      },
    ]"
  >
    <slot />
  </div>
</template>
