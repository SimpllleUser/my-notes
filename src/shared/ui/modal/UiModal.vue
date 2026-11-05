<script setup lang="ts">
import { onMounted, onUnmounted, watch, type VNodeChild } from 'vue'
import { ComponentSize } from '@/shared/model/enums.ts'
import { closeModal, getModalState, ModalCloseReason, type ModalAction, type ModalContent } from './modal.ts'

const props = withDefaults(
  defineProps<{
    global?: boolean
    size?: ComponentSize
    modalClass?: string | string[] | Record<string, boolean>
    boxClass?: string | string[] | Record<string, boolean>
    titleClass?: string | string[] | Record<string, boolean>
    bodyClass?: string | string[] | Record<string, boolean>
    actionsClass?: string | string[] | Record<string, boolean>
    closeOnBackdrop?: boolean
    showCloseButton?: boolean
    closeLabel?: string
  }>(),
  {
    global: false,
    size: ComponentSize.Medium,
    closeOnBackdrop: true,
    showCloseButton: true,
    closeLabel: 'Close dialog',
  },
)
const localOpen = defineModel<boolean>('open', { default: false })
const state = getModalState()
const modalSizeClasses: Record<ComponentSize, string> = {
  [ComponentSize.ExtraSmall]: 'max-w-xs',
  [ComponentSize.Small]: 'max-w-sm',
  [ComponentSize.Medium]: 'max-w-md',
  [ComponentSize.Large]: 'max-w-lg',
  [ComponentSize.ExtraLarge]: 'max-w-xl',
}
let dialog: HTMLDialogElement | null = null
let localDialog: HTMLDialogElement | null = null

function renderContent(content: ModalContent | undefined): VNodeChild {
  if (content === undefined) return null
  if (typeof content === 'function') return content()
  if (typeof content !== 'object') return content
  return content
}

function setDialog(element: unknown) {
  dialog = element as HTMLDialogElement | null
}

function setLocalDialog(element: unknown) {
  localDialog = element as HTMLDialogElement | null
}

function syncGlobalDialog() {
  if (!dialog) return
  if (state.active && !dialog.open) dialog.showModal()
  else if (!state.active && dialog.open) dialog.close()
}

function syncLocalDialog() {
  if (!localDialog) return
  if (localOpen.value && !localDialog.open) localDialog.showModal()
  else if (!localOpen.value && localDialog.open) localDialog.close()
}

function handleGlobalCancel(event: Event) {
  event.preventDefault()
  closeModal(undefined, ModalCloseReason.Escape)
}

function handleGlobalBackdrop(event: MouseEvent) {
  if (event.target === dialog && state.active?.closeOnBackdrop !== false) {
    closeModal(undefined, ModalCloseReason.Backdrop)
  }
}

function closeLocal() {
  localOpen.value = false
}

function handleLocalCancel(event: Event) {
  event.preventDefault()
  closeLocal()
}

function handleLocalBackdrop(event: MouseEvent) {
  if (event.target === localDialog && props.closeOnBackdrop) closeLocal()
}

async function handleAction(action: ModalAction) {
  if (action.disabled) return
  const shouldClose = await action.onClick?.({ close: (value) => closeModal(value, ModalCloseReason.Action) })
  if (shouldClose !== false && state.active) closeModal(action.value, ModalCloseReason.Action)
}

watch(() => state.active?.id, syncGlobalDialog, { flush: 'post' })
watch(localOpen, syncLocalDialog, { flush: 'post' })
onMounted(() => {
  syncGlobalDialog()
  syncLocalDialog()
})
onUnmounted(() => {
  if (dialog?.open) dialog.close()
  if (localDialog?.open) localDialog.close()
  dialog = null
  localDialog = null
})
</script>

<template>
  <dialog
    v-if="props.global && state.active"
    :key="state.active.id"
    :ref="setDialog"
    class="modal"
    :class="state.active.class"
    :aria-labelledby="state.active.title || state.active.slots?.title ? 'global-modal-title' : undefined"
    :aria-label="state.active.title || state.active.slots?.title ? undefined : state.active.ariaLabel"
    @cancel="handleGlobalCancel"
    @click="handleGlobalBackdrop"
  >
    <div
      class="modal-box"
      :class="[modalSizeClasses[state.active.size ?? ComponentSize.Medium], state.active.boxClass]"
    >
      <button
        v-if="state.active.showCloseButton !== false"
        type="button"
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        :aria-label="state.active.closeLabel ?? 'Close dialog'"
        @click="closeModal(undefined, ModalCloseReason.CloseButton)"
      >
        ✕
      </button>
      <h2
        v-if="state.active.title || state.active.slots?.title"
        id="global-modal-title"
        class="text-lg font-bold"
        :class="state.active.titleClass"
      >
        <component :is="state.active.slots?.title ?? (() => renderContent(state.active?.title))" />
      </h2>
      <div v-if="state.active.body || state.active.slots?.body" class="py-4" :class="state.active.bodyClass">
        <component :is="state.active.slots?.body ?? (() => renderContent(state.active?.body))" />
      </div>
      <div v-if="state.active.actions || state.active.slots?.actions" class="modal-action" :class="state.active.actionsClass">
        <component v-if="state.active.slots?.actions" :is="state.active.slots.actions" />
        <template v-if="Array.isArray(state.active.actions)">
          <button
            v-for="(action, index) in state.active.actions"
            :key="index"
            type="button"
            class="btn"
            :class="action.class"
            :disabled="action.disabled"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </button>
        </template>
        <component
          v-else-if="!state.active.slots?.actions && state.active.actions"
          :is="() => renderContent(state.active?.actions as ModalContent)"
        />
      </div>
    </div>
    <form
      class="modal-backdrop"
      @submit.prevent="state.active?.closeOnBackdrop !== false && closeModal(undefined, ModalCloseReason.Backdrop)"
    >
      <button type="submit" :aria-label="state.active.closeLabel ?? 'Close dialog'">close</button>
    </form>
  </dialog>

  <dialog
    v-else-if="!props.global && localOpen"
    :ref="setLocalDialog"
    class="modal"
    :class="props.modalClass"
    aria-labelledby="local-modal-title"
    @cancel="handleLocalCancel"
    @click="handleLocalBackdrop"
  >
    <div class="modal-box" :class="[modalSizeClasses[props.size], props.boxClass]">
      <button
        v-if="props.showCloseButton"
        type="button"
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        :aria-label="props.closeLabel"
        @click="closeLocal"
      >
        ✕
      </button>
      <h2 v-if="$slots.title" id="local-modal-title" class="text-lg font-bold" :class="props.titleClass">
        <slot name="title" :close="closeLocal" />
      </h2>
      <div v-if="$slots.body" class="py-4" :class="props.bodyClass">
        <slot name="body" :close="closeLocal" />
      </div>
      <div v-if="$slots.actions" class="modal-action" :class="props.actionsClass">
        <slot name="actions" :close="closeLocal" />
      </div>
    </div>
    <form class="modal-backdrop" @submit.prevent="props.closeOnBackdrop && closeLocal()">
      <button type="submit" :aria-label="props.closeLabel">close</button>
    </form>
  </dialog>
</template>
