import { ref } from 'vue'

const snippets = {
  popover: ['<ColorPicker v-model="color" />', '<IconPicker v-model="icon" />'].join('\n'),
  inline: [
    '<ColorPicker v-model="color" :popover="false" />',
    '<IconPicker v-model="icon" :popover="false" />',
  ].join('\n'),
  trigger: [
    '<IconPicker v-model="icon" auto-init>',
    '  <template #trigger="{ toggle, icon: Icon }">',
    '    <UiButton @click="toggle">',
    '      <component :is="Icon" :size="16" /> Обрати іконку',
    '    </UiButton>',
    '  </template>',
    '</IconPicker>',
  ].join('\n'),
}

export function usePickerExamples() {
  const color = ref<string | undefined>('bg-primary')
  const icon = ref<string | undefined>('Lightbulb')
  const inlineColor = ref<string | undefined>('bg-secondary-blue')
  const inlineIcon = ref<string | undefined>('BookOpen')
  const customColor = ref<string | undefined>()
  const customIcon = ref<string | undefined>()

  return { color, icon, inlineColor, inlineIcon, customColor, customIcon, snippets }
}
