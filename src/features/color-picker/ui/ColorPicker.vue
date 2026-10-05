<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UiPopover } from '@/shared/ui'
import { useColorPicker } from '../model/useColorPicker'

const props = withDefaults(defineProps<{ label?: string; autoOpen?: boolean }>(), { label: 'Обрати колір', autoOpen: false })
const model = defineModel<string | undefined>()
const emit = defineEmits<{ select: [value: string] }>()

const isOpen = ref(false)
const popoverRef = ref<InstanceType<typeof UiPopover> | null>(null)
const { swatches } = useColorPicker()

function select(value: string) {
  model.value = value
  emit('select', value)
  isOpen.value = false
}

onMounted(() => {
  if (props.autoOpen) isOpen.value = true
})

defineExpose({
  show: () => popoverRef.value?.show(),
  hide: () => popoverRef.value?.hide(),
  toggle: () => popoverRef.value?.toggle(),
})
</script>

<template>
  <UiPopover ref="popoverRef" v-model:open="isOpen" panel-class="w-56">
    <template #trigger="{ toggle, open }">
      <slot name="trigger" :open="open" :toggle="toggle" :value="model">
        <button
          type="button"
          :aria-label="label"
          :title="label"
          class="grid h-10 w-10 place-items-center rounded-brutal border-2 border-ink transition duration-150 hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
          :class="model ?? 'bg-bg'"
          @click="toggle"
        />
      </slot>
    </template>

    <p class="mb-2 text-xs font-bold uppercase tracking-wider text-ink-light">{{ label }}</p>
    <div class="grid grid-cols-4 gap-2">
      <button
        v-for="swatch in swatches"
        :key="swatch.class"
        type="button"
        :title="swatch.name"
        class="aspect-square rounded-lg border-2 transition duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-90"
        :class="[swatch.class, swatch.class === model ? 'border-ink' : 'border-transparent']"
        @click="select(swatch.class)"
      />
    </div>
  </UiPopover>
</template>
