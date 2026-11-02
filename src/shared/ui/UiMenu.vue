<script setup lang="ts">
import { MenuDirection, MenuSize, MenuVariant } from '@/shared/model/enums.ts'

withDefaults(
  defineProps<{
    title?: string
    label?: string
    direction?: MenuDirection
    size?: MenuSize
    variant?: MenuVariant
  }>(),
  {
    title: '',
    direction: MenuDirection.Vertical,
    size: MenuSize.Medium,
    variant: MenuVariant.Box,
  },
)

const selectedValue = defineModel<string>({ default: '' })
const emit = defineEmits<{ select: [value: string] }>()

function select(value: string) {
  selectedValue.value = value
  emit('select', value)
}

function isActive(value: string) {
  return selectedValue.value === value
}
</script>

<template>
  <ul
    class="menu"
    :aria-label="label"
    :class="{
      'menu-vertical': direction === MenuDirection.Vertical,
      'menu-horizontal': direction === MenuDirection.Horizontal,
      'menu-xs': size === MenuSize.ExtraSmall,
      'menu-sm': size === MenuSize.Small,
      'menu-md': size === MenuSize.Medium,
      'menu-lg': size === MenuSize.Large,
      'menu-xl': size === MenuSize.ExtraLarge,
      'rounded-box bg-base-200': variant === MenuVariant.Box,
      'rounded-box border border-base-300 bg-base-100': variant === MenuVariant.Bordered,
    }"
  >
    <li v-if="title || $slots.title" class="menu-title">
      <slot name="title">{{ title }}</slot>
    </li>
    <slot :selected="selectedValue" :select="select" :is-active="isActive" />
  </ul>
</template>
