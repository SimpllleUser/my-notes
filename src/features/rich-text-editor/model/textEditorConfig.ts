import type { Component } from 'vue'
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Type,
} from '@lucide/vue'
import type { EditorActions } from './useEditorActions'

export type TurnIntoItem = { label: string; icon: Component; run: () => void }
export type HighlightColor = { label: string; color: string }

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  { label: 'Жовтий', color: '#fff3a8' },
  { label: 'Червоний', color: '#ffd3d6' },
  { label: 'Синій', color: '#c8dcff' },
  { label: 'Зелений', color: '#cdeecb' },
  { label: 'Фіолетовий', color: '#e3d3fc' },
]

export function createTurnIntoItems(actions: EditorActions): TurnIntoItem[] {
  return [
    { label: 'Звичайний текст', icon: Type, run: actions.setText },
    { label: 'Заголовок 1', icon: Heading1, run: () => actions.setHeading(1) },
    { label: 'Заголовок 2', icon: Heading2, run: () => actions.setHeading(2) },
    { label: 'Заголовок 3', icon: Heading3, run: () => actions.setHeading(3) },
    { label: 'Маркований список', icon: List, run: actions.toggleBulletList },
    { label: 'Нумерований список', icon: ListOrdered, run: actions.toggleOrderedList },
    { label: 'Список задач', icon: ListChecks, run: actions.toggleTaskList },
    { label: 'Цитата', icon: Quote, run: actions.toggleBlockquote },
    { label: 'Код', icon: Code, run: actions.toggleCodeBlock },
  ]
}

export function clampViewportPosition(
  value: number,
  viewportSize: number,
  elementSize: number,
  gutter = 8,
) {
  return Math.max(gutter, Math.min(value, viewportSize - elementSize - gutter))
}
