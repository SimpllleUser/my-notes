import { shallowReactive, type VNode, type VNodeChild } from 'vue'
import type { ComponentSize } from '@/shared/model/enums.ts'

export enum ModalCloseReason {
  Action = 'action',
  CloseButton = 'close-button',
  Backdrop = 'backdrop',
  Escape = 'escape',
  Programmatic = 'programmatic',
}

export type ModalActionContext = {
  close: (value?: unknown) => void
}

export type ModalAction = {
  label: string
  value?: unknown
  class?: string | string[] | Record<string, boolean>
  disabled?: boolean
  onClick?: (context: ModalActionContext) => void | boolean | Promise<void | boolean>
}

export type ModalContent = string | VNode | (() => VNodeChild)
export type ModalSlots = {
  title?: () => VNodeChild
  body?: () => VNodeChild
  actions?: () => VNodeChild
}

export type ModalOptions = {
  size?: ComponentSize
  title?: ModalContent
  body?: ModalContent
  actions?: ModalAction[] | ModalContent
  /** Render callbacks that act as named Vue slots for arbitrary interactive content. */
  slots?: ModalSlots
  /** Extra classes for the daisyUI `modal` element. */
  class?: string | string[] | Record<string, boolean>
  /** Extra classes for the daisyUI `modal-box`. */
  boxClass?: string | string[] | Record<string, boolean>
  titleClass?: string | string[] | Record<string, boolean>
  bodyClass?: string | string[] | Record<string, boolean>
  actionsClass?: string | string[] | Record<string, boolean>
  ariaLabel?: string
  closeOnBackdrop?: boolean
  showCloseButton?: boolean
  closeLabel?: string
}

export type ModalResult = {
  reason: ModalCloseReason
  value?: unknown
}

type ActiveModal = ModalOptions & { id: number }

const state = shallowReactive<{ active: ActiveModal | null }>({ active: null })
let nextId = 0
let resolveActive: ((result: ModalResult) => void) | undefined

export function openModal(options: ModalOptions): Promise<ModalResult> {
  if (resolveActive) resolveActive({ reason: ModalCloseReason.Programmatic })

  const id = ++nextId
  state.active = { ...options, id }

  return new Promise((resolve) => {
    resolveActive = resolve
  })
}

export function closeModal(value?: unknown, reason: ModalCloseReason = ModalCloseReason.Programmatic) {
  if (!state.active) return
  const resolve = resolveActive
  resolveActive = undefined
  state.active = null
  resolve?.({ reason, value })
}

export function useModal() {
  return { open: openModal, close: closeModal }
}

export function getModalState() {
  return state
}
