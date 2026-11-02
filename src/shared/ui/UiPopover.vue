<script setup lang="ts">
import {
  computed,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
  type CSSProperties,
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

const model = defineModel<boolean>({ default: false })

const uid = useId()
const contentId = computed(() => props.id ?? `ui-popover-${uid}`)
const rootRef = ref<HTMLElement | null>(null)

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

const panelStyle = computed<CSSProperties>(() => {
  const { side } = parseLocation(props.location)
  const gap = `${props.offset}px`
  const style: CSSProperties = {}

  switch (side) {
    case PopoverSide.Top:
      style.marginBottom = gap
      break
    case PopoverSide.Bottom:
      style.marginTop = gap
      break
    case PopoverSide.Left:
      style.marginRight = gap
      break
    case PopoverSide.Right:
      style.marginLeft = gap
      break
    case PopoverSide.Center:
      style.top = '50%'
      style.left = '50%'
      style.transform = 'translate(-50%, -50%)'
      return style
  }

  return style
})

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
  if (rootRef.value && rootRef.value.contains(event.target as globalThis.Node)) return
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

    <div
      v-if="eager || model"
      v-show="model"
      tabindex="0"
      :id="contentId"
      v-bind="contentProps"
      class="dropdown-content z-20 max-w-[calc(100vw-2rem)] rounded-box bg-base-100 p-4 shadow-xl"
      :class="contentClass"
      :style="panelStyle"
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
  </div>
</template>
