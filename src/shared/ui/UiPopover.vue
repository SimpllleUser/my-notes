<script setup lang="ts">
import {
  computed,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  nextTick,
  ref,
  useId,
  watch,
  type CSSProperties,
  type VNodeChild,
} from 'vue'
import { PopoverAlign, PopoverLocation, PopoverSide } from '@/shared/model/enums.ts'

/**
 * Розташування панелі відносно активатора — як `location` у Vuetify `VTooltip`:
 * сторона + опційне вирівнювання (наприклад, `"bottom end"`).
 */
const props = withDefaults(
  defineProps<{
    /** Текст контенту панелі, якщо не передано default-слот. */
    text?: string
    /** Id елемента контенту (використовується в `aria-describedby` активатора). */
    id?: string
    /** Hover по контенту панелі не запускає закриття (для `openOnHover`). Кліки по панелі ніколи не закривають popover. */
    interactive?: boolean
    /** Вимикає керування через активатор і закриває панель. */
    disabled?: boolean
    /** `true` — контент рендериться завжди (`v-show`), `false` — лише коли відкрито (`v-if`). */
    eager?: boolean
    /** Не закривати панель кліком поза нею. */
    persistent?: boolean
    /** Розташування панелі: сторона + вирівнювання, як у VTooltip. */
    location?: PopoverLocation
    /** Відступ від активатора, px (аналог `offset` у VTooltip). */
    offset?: number
    /** Відкривати панель при наведенні на активатор (аналог `openOnHover`). */
    openOnHover?: boolean
    /** Відкривати/закривати панель кліком по активатору (аналог `openOnClick`). */
    openOnClick?: boolean
    /** Затримка відкриття, мс (для `openOnHover`). */
    openDelay?: number
    /** Затримка закриття, мс (для `openOnHover`). */
    closeDelay?: number
    /** Додаткові класи для елемента панелі (аналог `contentClass`). */
    contentClass?: string
    /** Додаткові атрибути/події для елемента панелі (аналог `contentProps`). */
    contentProps?: Record<string, unknown>
    /** Атрибути/події, які merge-яться у props активатора (аналог `activatorProps`). */
    activatorProps?: Record<string, unknown>
  }>(),
  {
    text: undefined,
    id: undefined,
    interactive: false,
    disabled: false,
    eager: true,
    persistent: false,
    // VTooltip за замовчуванням використовує `"end"`; для панелі-поповера
    // зберігаємо історичний вигляд — під активатором, по правому краю.
    location: PopoverLocation.BottomEnd,
    offset: 10,
    openOnHover: false,
    openOnClick: true,
    openDelay: 0,
    closeDelay: 0,
    contentClass: '',
    contentProps: undefined,
    activatorProps: undefined,
  },
)

const emit = defineEmits<{
  /** Клік поза панеллю та активатором (аналог `click:outside` у VOverlay). */
  'click:outside': [event: MouseEvent]
}>()

defineSlots<{
  activator?: (props: { isActive: boolean; props: Record<string, unknown> }) => VNodeChild
  default?: (props: { isActive: boolean; hide: () => void }) => VNodeChild
  menu?: (props: { isActive: boolean; hide: () => void }) => VNodeChild
  header?: (props: { isActive: boolean; hide: () => void }) => VNodeChild
  actions?: (props: { isActive: boolean; hide: () => void }) => VNodeChild
}>()

const model = defineModel<boolean>({ default: false })

const uid = useId()
const contentId = computed(() => props.id ?? `ui-popover-${uid}`)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const floatingStyle = ref<CSSProperties>({ position: 'fixed', top: '0px', left: '0px' })

const SIDES: Record<string, PopoverSide> = {
  top: PopoverSide.Top,
  bottom: PopoverSide.Bottom,
  left: PopoverSide.Left,
  right: PopoverSide.Right,
  start: PopoverSide.Left,
  end: PopoverSide.Right,
  center: PopoverSide.Center,
}

function parseLocation(location: PopoverLocation): { side: PopoverSide; align: PopoverAlign } {
  const [rawSide = 'bottom', rawAlign = 'center'] = location.trim().split(/\s+/)
  const side = SIDES[rawSide] ?? PopoverSide.Bottom
  const align =
    rawAlign === PopoverAlign.Start || rawAlign === PopoverAlign.End
      ? rawAlign
      : PopoverAlign.Center
  return { side, align }
}

function updatePanelPosition() {
  const activator = rootRef.value?.firstElementChild as HTMLElement | null
  const panel = panelRef.value
  if (!activator || !panel) return

  const anchor = activator.getBoundingClientRect()
  const bounds = panel.getBoundingClientRect()
  const { side, align } = parseLocation(props.location)
  let top = anchor.bottom + props.offset
  let left = anchor.left

  if (side === PopoverSide.Top) top = anchor.top - bounds.height - props.offset
  if (side === PopoverSide.Left) {
    top = anchor.top
    left = anchor.left - bounds.width - props.offset
  }
  if (side === PopoverSide.Right) {
    top = anchor.top
    left = anchor.right + props.offset
  }
  if (side === PopoverSide.Center) {
    top = (window.innerHeight - bounds.height) / 2
    left = (window.innerWidth - bounds.width) / 2
  } else if (side === PopoverSide.Top || side === PopoverSide.Bottom) {
    if (align === PopoverAlign.Center) left = anchor.left + (anchor.width - bounds.width) / 2
    if (align === PopoverAlign.End) left = anchor.right - bounds.width
  } else if (align === PopoverAlign.Center) {
    top = anchor.top + (anchor.height - bounds.height) / 2
  } else if (align === PopoverAlign.End) {
    top = anchor.bottom - bounds.height
  }

  left = Math.max(8, Math.min(left, window.innerWidth - bounds.width - 8))
  top = Math.max(8, Math.min(top, window.innerHeight - bounds.height - 8))
  floatingStyle.value = { position: 'fixed', top: `${top}px`, left: `${left}px` }
}

watch(model, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  updatePanelPosition()
})

function updateOpenPanelPosition() {
  if (model.value) updatePanelPosition()
}

const locationClasses = computed(() => {
  const { side, align } = parseLocation(props.location)
  const sideClass = {
    [PopoverSide.Top]: 'dropdown-top',
    [PopoverSide.Bottom]: 'dropdown-bottom',
    [PopoverSide.Left]: 'dropdown-left',
    [PopoverSide.Right]: 'dropdown-right',
    [PopoverSide.Center]: 'dropdown-center',
  }[side]

  if (side === PopoverSide.Center) return ''

  const alignClass = {
    [PopoverAlign.Start]: 'dropdown-start',
    [PopoverAlign.Center]: 'dropdown-center',
    [PopoverAlign.End]: 'dropdown-end',
  }[align]

  return `${sideClass} ${alignClass}`
})

let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined

function clearTimers() {
  if (openTimer !== undefined) {
    clearTimeout(openTimer)
    openTimer = undefined
  }
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }
}

function show() {
  if (props.disabled) return
  clearTimers()
  model.value = true
}

function hide() {
  clearTimers()
  model.value = false
}

function toggle() {
  if (model.value) hide()
  else show()
}

function onActivatorEnter() {
  if (!props.openOnHover || props.disabled) return
  clearTimers()
  if (props.openDelay > 0) openTimer = setTimeout(show, props.openDelay)
  else show()
}

function onActivatorLeave() {
  if (!props.openOnHover || props.disabled) return
  clearTimers()
  const delay = props.closeDelay || (props.interactive ? 100 : 0)
  if (delay > 0) closeTimer = setTimeout(hide, delay)
  else hide()
}

function onActivatorClick() {
  if (!props.openOnClick || props.disabled) return
  toggle()
}

function onContentEnter() {
  if (!props.interactive) return
  clearTimers()
}

function onContentLeave() {
  if (!props.openOnHover || !props.interactive) return
  clearTimers()
  if (props.closeDelay > 0) closeTimer = setTimeout(hide, props.closeDelay)
  else hide()
}

/** Props для слота `activator` — аналог `activatorEvents`/`activatorProps` у VOverlay. */
const activatorSlotProps = computed(() =>
  mergeProps(
    {
      'aria-describedby': contentId.value,
      'aria-controls': contentId.value,
      'aria-expanded': model.value,
    },
    props.openOnHover ? { onMouseenter: onActivatorEnter, onMouseleave: onActivatorLeave } : {},
    props.openOnClick ? { onClick: onActivatorClick } : {},
    props.activatorProps ?? {},
  ),
)

function handleClickOutside(event: MouseEvent) {
  if (!model.value || props.disabled) return
  if (
    (rootRef.value && rootRef.value.contains(event.target as globalThis.Node)) ||
    (panelRef.value && panelRef.value.contains(event.target as globalThis.Node))
  ) return
  emit('click:outside', event)
  if (!props.persistent) hide()
}

function syncOutsideListener(isOpen: boolean) {
  if (isOpen) document.addEventListener('pointerdown', handleClickOutside)
  else document.removeEventListener('pointerdown', handleClickOutside)
}

onMounted(() => {
  syncOutsideListener(model.value)
  watch(model, syncOutsideListener)
  window.addEventListener('resize', updateOpenPanelPosition)
  window.addEventListener('scroll', updateOpenPanelPosition, true)
})

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) hide()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimers()
  document.removeEventListener('pointerdown', handleClickOutside)
  window.removeEventListener('resize', updateOpenPanelPosition)
  window.removeEventListener('scroll', updateOpenPanelPosition, true)
})

defineExpose({ isActive: model, show, hide, toggle })
</script>

<template>
  <div
    ref="rootRef"
    class="dropdown"
    :class="[locationClasses, { 'dropdown-open': model, 'dropdown-close': !model }]"
  >
    <slot name="activator" :is-active="model" :props="activatorSlotProps" />

    <Teleport to="body">
      <div
        v-if="eager || model"
        ref="panelRef"
        v-show="model"
        tabindex="0"
        :id="contentId"
        v-bind="contentProps"
        class="fixed z-[9999] max-w-[calc(100vw-2rem)] rounded-box bg-base-100 p-4 shadow-xl"
        :class="contentClass"
        :style="floatingStyle"
        @mouseenter="onContentEnter"
        @mouseleave="onContentLeave"
      >
      <div v-if="$slots.header" class="pb-2 font-semibold">
        <slot name="header" :is-active="model" :hide="hide" />
      </div>
      <ul v-if="$slots.menu" class="menu w-full p-0">
        <slot name="menu" :is-active="model" :hide="hide" />
      </ul>
      <slot :is-active="model" :hide="hide">{{ text }}</slot>
      <div v-if="$slots.actions" class="flex justify-end gap-2 pt-2">
        <slot name="actions" :is-active="model" :hide="hide" />
      </div>
      </div>
    </Teleport>
  </div>
</template>
