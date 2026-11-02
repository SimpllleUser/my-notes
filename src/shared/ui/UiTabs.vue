<script setup lang="ts">
import { computed, useId } from 'vue'
import { TabsPlacement, TabsSize, TabsVariant } from '@/shared/model/enums.ts'
import type { UiTabItem } from './tabs.types.ts'

const props = withDefaults(
  defineProps<{
    tabs: UiTabItem[]
    variant?: TabsVariant
    placement?: TabsPlacement
    size?: TabsSize
    label?: string
  }>(),
  {
    variant: TabsVariant.Border,
    placement: TabsPlacement.Top,
    size: TabsSize.Medium,
    label: 'Tabs',
  },
)

const activeModel = defineModel<string>({ default: '' })
const emit = defineEmits<{ select: [tab: UiTabItem] }>()
const uid = useId()

const enabledTabs = computed(() => props.tabs.filter((tab) => !tab.disabled))
const activeTab = computed(
  () => enabledTabs.value.find((tab) => tab.id === activeModel.value) ?? enabledTabs.value[0],
)
const activeId = computed(() => activeTab.value?.id ?? '')

function tabElementId(id: string) {
  return `${uid}-tab-${id}`
}

function panelElementId(id: string) {
  return `${uid}-panel-${id}`
}

function select(tab: UiTabItem) {
  if (tab.disabled) return
  activeModel.value = tab.id
  emit('select', tab)
}

function onKeydown(event: KeyboardEvent, tab: UiTabItem) {
  const index = enabledTabs.value.findIndex((item) => item.id === tab.id)
  if (index < 0 || enabledTabs.value.length < 2) return

  let nextIndex: number
  switch (event.key) {
    case 'ArrowRight':
      nextIndex = (index + 1) % enabledTabs.value.length
      break
    case 'ArrowLeft':
      nextIndex = (index - 1 + enabledTabs.value.length) % enabledTabs.value.length
      break
    case 'Home':
      nextIndex = 0
      break
    case 'End':
      nextIndex = enabledTabs.value.length - 1
      break
    default:
      return
  }

  event.preventDefault()
  const nextTab = enabledTabs.value[nextIndex]
  if (!nextTab) return
  select(nextTab)
  document.getElementById(tabElementId(nextTab.id))?.focus()
}
</script>

<template>
  <div class="flex flex-col" :class="{ 'flex-col-reverse': placement === TabsPlacement.Bottom }">
    <div
      role="tablist"
      :aria-label="label"
      class="tabs"
      :class="[
        {
          'tabs-box': variant === TabsVariant.Box,
          'tabs-border': variant === TabsVariant.Border,
          'tabs-lift': variant === TabsVariant.Lift,
          'tabs-top': placement === TabsPlacement.Top,
          'tabs-bottom': placement === TabsPlacement.Bottom,
          'tabs-xs': size === TabsSize.ExtraSmall,
          'tabs-sm': size === TabsSize.Small,
          'tabs-md': size === TabsSize.Medium,
          'tabs-lg': size === TabsSize.Large,
          'tabs-xl': size === TabsSize.ExtraLarge,
        },
      ]"
    >
      <button
        v-for="tab in tabs"
        :id="tabElementId(tab.id)"
        :key="tab.id"
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': activeId === tab.id, 'tab-disabled': tab.disabled }"
        :disabled="tab.disabled"
        :tabindex="activeId === tab.id ? 0 : -1"
        :aria-selected="activeId === tab.id"
        :aria-controls="panelElementId(tab.id)"
        @click="select(tab)"
        @keydown="onKeydown($event, tab)"
      >
        <slot name="icon" :tab="tab" :active="activeId === tab.id" />
        <slot name="label" :tab="tab" :active="activeId === tab.id">{{ tab.label }}</slot>
      </button>
    </div>
    <div
      v-if="activeTab"
      :id="panelElementId(activeTab.id)"
      role="tabpanel"
      class="rounded-box border border-base-300 bg-base-100 p-4"
      :aria-labelledby="tabElementId(activeTab.id)"
      tabindex="0"
    >
      <slot :name="activeTab.id" :tab="activeTab">
        <slot :tab="activeTab" />
      </slot>
    </div>
  </div>
</template>
