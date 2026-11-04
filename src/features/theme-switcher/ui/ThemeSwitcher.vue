<script setup lang="ts">
import { Check, Palette } from '@lucide/vue'
import {
  ButtonColor,
  ButtonSize,
  ButtonVariant,
  DropdownLocation,
  ThemePalette,
} from '@/shared/model/enums.ts'
import { useTheme } from '@/shared/lib/theme.ts'
import { UiButton, UiDropdown } from '@/shared/ui'
import { nextTick } from 'vue'

const emits = defineEmits<{
  select: []
}>()

const { theme, setTheme } = useTheme()
const palettes = Object.values(ThemePalette)

function selectTheme(palette: ThemePalette, hide: () => void) {
  setTheme(palette)
  hide()
  nextTick(() => {
    emits('select')
  })
}
</script>

<template>
  <UiDropdown :location="DropdownLocation.BottomEnd" content-class="w-52 p-2">
    <template #trigger="{ props, open }">
      <UiButton
        v-bind="props"
        :active="open"
        :variant="ButtonVariant.Flat"
        :color="ButtonColor.Primary"
        :size="ButtonSize.Small"
        :aria-label="`Color theme: ${theme}`"
        aria-haspopup="menu"
      >
        <Palette class="size-4" aria-hidden="true" />
        <span class="capitalize">{{ theme }}</span>
      </UiButton>
    </template>

    <template #default="{ hide }">
      <li v-for="palette in palettes" :key="palette">
        <button
          type="button"
          :class="{ 'menu-active': theme === palette }"
          :aria-current="theme === palette ? 'true' : undefined"
          @click="selectTheme(palette, hide)"
        >
          <span class="capitalize">{{ palette }}</span>
          <Check v-if="theme === palette" class="ml-auto size-4" aria-hidden="true" />
        </button>
      </li>
    </template>
  </UiDropdown>
</template>
