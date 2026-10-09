export type ColorSwatch = { name: string; class: string }

const SWATCHES: ColorSwatch[] = [
  { name: 'Рожевий', class: 'bg-primary' },
  { name: 'Жовтий', class: 'bg-primary-yellow' },
  { name: 'Синій', class: 'bg-secondary-blue' },
  { name: 'Фіолетовий', class: 'bg-secondary-purple' },
  { name: 'Зелений', class: 'bg-secondary-green' },
  { name: 'Мятний', class: 'bg-accent-mint' },
  { name: 'Помаранчевий', class: 'bg-accent-orange' },
  { name: 'Червоний', class: 'bg-secondary-red' },
  { name: 'Голубий', class: 'bg-secondary-cyan' },
  { name: 'Бірюзовий', class: 'bg-secondary-teal' },
  { name: 'Лаймовий', class: 'bg-secondary-lime' },
  { name: 'Золотий', class: 'bg-accent-gold' },
  { name: 'Небесний', class: 'bg-accent-sky' },
  { name: 'Лавандовий', class: 'bg-accent-lavender' },
  { name: 'Коричневий', class: 'bg-accent-brown' },
  { name: 'Чорнило', class: 'bg-ink' },
]

export function useColorPicker() {
  return { swatches: SWATCHES }
}
