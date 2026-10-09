export type ColorSwatch = { name: string; class: string }

const SWATCHES: ColorSwatch[] = [
  { name: 'Рожевий', class: 'bg-primary' },
  { name: 'Жовтий', class: 'bg-primary-yellow' },
  { name: 'Синій', class: 'bg-secondary-blue' },
  { name: 'Фіолетовий', class: 'bg-secondary-purple' },
  { name: 'Зелений', class: 'bg-secondary-green' },
  { name: 'Мятний', class: 'bg-accent-mint' },
  { name: 'Помаранчевий', class: 'bg-accent-orange' },
  { name: 'Чорнило', class: 'bg-ink' },
]


export function useColorPicker() {
  return { swatches: SWATCHES }
}
