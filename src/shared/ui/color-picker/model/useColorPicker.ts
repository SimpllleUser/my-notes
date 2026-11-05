import { FolderColor } from '@/shared/model/enums.ts'

export type ColorSwatch = { name: string; class: FolderColor }

const SWATCHES: ColorSwatch[] = [
  { name: 'Рожевий', class: FolderColor.Primary },
  { name: 'Жовтий', class: FolderColor.Yellow },
  { name: 'Синій', class: FolderColor.Blue },
  { name: 'Фіолетовий', class: FolderColor.Purple },
  { name: 'Зелений', class: FolderColor.Green },
  { name: 'Мятний', class: FolderColor.Mint },
  { name: 'Помаранчевий', class: FolderColor.Orange },
  { name: 'Червоний', class: FolderColor.Red },
  { name: 'Голубий', class: FolderColor.Cyan },
  { name: 'Бірюзовий', class: FolderColor.Teal },
  { name: 'Лаймовий', class: FolderColor.Lime },
  { name: 'Золотий', class: FolderColor.Gold },
  { name: 'Небесний', class: FolderColor.Sky },
  { name: 'Лавандовий', class: FolderColor.Lavender },
  { name: 'Коричневий', class: FolderColor.Brown },
  { name: 'Чорнило', class: FolderColor.Ink },
]

export function useColorPicker() {
  return { swatches: SWATCHES }
}
