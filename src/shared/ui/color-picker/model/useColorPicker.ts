import { FolderColor } from '@/shared/model/enums.ts'

export type ColorSwatch = { name: string; class: FolderColor }

const SWATCHES: ColorSwatch[] = [
  {name: 'Red', class: FolderColor.Red},
  {name: 'Orange', class: FolderColor.Orange},
  {name: 'Amber', class: FolderColor.Amber},
  {name: 'Yellow', class: FolderColor.Yellow},
  {name: 'Lime', class: FolderColor.Lime},
  {name: 'Green', class: FolderColor.Green},
  {name: 'Emerald', class: FolderColor.Emerald},
  {name: 'Teal', class: FolderColor.Teal},
  {name: 'Cyan', class: FolderColor.Cyan},
  {name: 'Sky', class: FolderColor.Sky},
  {name: 'Blue', class: FolderColor.Blue},
  {name: 'Indigo', class: FolderColor.Indigo},
  {name: 'Violet', class: FolderColor.Violet},
  {name: 'Purple', class: FolderColor.Purple},
  {name: 'Fuchsia', class: FolderColor.Fuchsia},
  {name: 'Pink', class: FolderColor.Pink},
]

export function useColorPicker() {
  return { swatches: SWATCHES }
}
