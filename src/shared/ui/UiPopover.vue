<script setup lang="ts">
import { computed, mergeProps, onBeforeUnmount, ref, useId, watch, type CSSProperties } from 'vue'

/**
 * Розташування панелі відносно активатора — як `location` у Vuetify `VTooltip`:
 * сторона + опційне вирівнювання (наприклад, `"bottom end"`).
 */
type PopoverLocation =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'start'
  | 'end'
  | 'center'
  | 'top start'
  | 'top center'
  | 'top end'
  | 'bottom start'
  | 'bottom center'
  | 'bottom end'
  | 'left start'
  | 'left center'
  | 'left end'
  | 'right start'
  | 'right center'
  | 'right end'

type Side = 'top' | 'bottom' | 'left' | 'right' | 'center'
type Align = 'start' | 'center' | 'end'

const props = withDefaults(
  defineProps<{
    /** Керує видимістю панелі (`v-model`, аналог `modelValue` у VTooltip). */
    modelValue?: boolean
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
    modelValue: false,
    text: undefined,
    id: undefined,
    interactive: false,
    disabled: false,
    eager: true,
    persistent: false,
    // VTooltip за замовчуванням використовує `"end"`; для панелі-поповера
    // зберігаємо історичний вигляд — під активатором, по правому краю.
    location: 'bottom end',
    offset: 10,
    openOnHover: true,
    openOnClick: false,
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

const SIDES: Record<string, Side> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  start: 'left',
  end: 'right',
  center: 'center',
}

function parseLocation(location: string): { side: Side; align: Align } {
  const [rawSide = 'bottom', rawAlign = 'center'] = location.trim().split(/\s+/)
  const side = SIDES[rawSide] ?? 'bottom'
  const align: Align = rawAlign === 'start' || rawAlign === 'end' ? rawAlign : 'center'
  return { side, align }
}

const panelStyle = computed<CSSProperties>(() => {
  const { side, align } = parseLocation(props.location)
  const gap = `${props.offset}px`
  const style: CSSProperties = {}

  switch (side) {
    case 'top':
      style.bottom = '100%'
      style.marginBottom = gap
      break
    case 'bottom':
      style.top = '100%'
      style.marginTop = gap
      break
    case 'left':
      style.right = '100%'
      style.marginRight = gap
      break
    case 'right':
      style.left = '100%'
      style.marginLeft = gap
      break
    case 'center':
      style.left = '50%'
      style.top = '50%'
      style.transform = 'translate(-50%, -50%)'
      return style
  }

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') style.left = '0'
    else if (align === 'end') style.right = '0'
    else {
      style.left = '50%'
      style.transform = 'translateX(-50%)'
    }
  } else {
    if (align === 'start') style.top = '0'
    else if (align === 'end') style.bottom = '0'
    else {
      style.top = '50%'
      style.transform = 'translateY(-50%)'
    }
  }

  return style
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
  if (props.closeDelay > 0) closeTimer = setTimeout(hide, props.closeDelay)
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

watch(model, (isOpen) => {
  if (isOpen) document.addEventListener('mousedown', handleClickOutside)
  else document.removeEventListener('mousedown', handleClickOutside)
})

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) hide()
  },
)

onBeforeUnmount(() => {
  clearTimers()
  document.removeEventListener('mousedown', handleClickOutside)
})

defineExpose({ isActive: model, show, hide, toggle })
</script>

<template>
  <div ref="rootRef" class="relative inline-block">
    <slot name="activator" :is-active="model" :props="activatorSlotProps" />

    <div
      v-if="eager || model"
      v-show="model"
      :id="contentId"
      v-bind="contentProps"
      class="absolute z-20 max-w-[calc(100vw-2rem)] rounded-brutal border-3 border-ink bg-accent-paper p-3 shadow-brutal"
      :class="contentClass"
      :style="panelStyle"
      @mouseenter="onContentEnter"
      @mouseleave="onContentLeave"
    >
      <slot :is-active="model" :hide="hide">{{ text }}</slot>
    </div>
  </div>
</template>
