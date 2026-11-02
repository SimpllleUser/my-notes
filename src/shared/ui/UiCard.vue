<script setup lang="ts">
import {
  CardActionsAlign,
  CardElement,
  CardFigurePosition,
  CardSize,
} from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    as?: CardElement
    size?: CardSize
    figurePosition?: CardFigurePosition
    actionsAlign?: CardActionsAlign
    compact?: boolean
    side?: boolean
    imageFull?: boolean
    bordered?: boolean
  }>(),
  {
    as: CardElement.Div,
    size: CardSize.Medium,
    figurePosition: CardFigurePosition.Top,
    actionsAlign: CardActionsAlign.End,
    compact: false,
    side: false,
    imageFull: false,
    bordered: false,
  },
)
</script>

<template>
  <component
    :is="as"
    class="card bg-base-100 shadow-sm"
    :class="[
      {
        'card-xs': !compact && size === CardSize.ExtraSmall,
        'card-sm': compact || size === CardSize.Small,
        'card-md': !compact && size === CardSize.Medium,
        'card-lg': !compact && size === CardSize.Large,
        'card-xl': !compact && size === CardSize.ExtraLarge,
        'card-side': side,
        'image-full': imageFull,
        'card-border': bordered,
      },
    ]"
  >
    <figure v-if="$slots.figure && figurePosition === CardFigurePosition.Top">
      <slot name="figure" />
    </figure>
    <div class="card-body">
      <h2 v-if="$slots.title || $slots['title-extra']" class="card-title">
        <slot name="title" />
        <slot name="title-extra" />
      </h2>
      <slot />
      <div
        v-if="$slots.actions"
        class="card-actions"
        :class="{
          'justify-start': actionsAlign === CardActionsAlign.Start,
          'justify-center': actionsAlign === CardActionsAlign.Center,
          'justify-end': actionsAlign === CardActionsAlign.End,
        }"
      >
        <slot name="actions" />
      </div>
    </div>
    <figure v-if="$slots.figure && figurePosition === CardFigurePosition.Bottom">
      <slot name="figure" />
    </figure>
  </component>
</template>
