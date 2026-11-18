import type { Component } from 'vue'
import type { Blok, BlockToolData } from '@bloklabs/core'
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from '@lucide/vue'

export enum EditorCommand {
  Undo = 'undo',
  Redo = 'redo',
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Text = 'text',
  Heading1 = 'heading1',
  Heading2 = 'heading2',
  Heading3 = 'heading3',
  BulletedList = 'bulleted-list',
  NumberedList = 'numbered-list',
  Checklist = 'checklist',
  Quote = 'quote',
  Code = 'code',
}

export interface EditorCommandItem {
  command: EditorCommand
  label: string
  icon: Component
}

/** Групи розділяються у тулбарі вертикальним роздільником. */
export const EDITOR_COMMAND_GROUPS: EditorCommandItem[][] = [
  [
    { command: EditorCommand.Undo, label: 'Скасувати', icon: Undo2 },
    { command: EditorCommand.Redo, label: 'Повторити', icon: Redo2 },
  ],
  [
    { command: EditorCommand.Bold, label: 'Жирний', icon: Bold },
    { command: EditorCommand.Italic, label: 'Курсив', icon: Italic },
    { command: EditorCommand.Underline, label: 'Підкреслений', icon: Underline },
    { command: EditorCommand.Strikethrough, label: 'Закреслений', icon: Strikethrough },
  ],
  [
    { command: EditorCommand.Text, label: 'Текст', icon: Pilcrow },
    { command: EditorCommand.Heading1, label: 'Заголовок 1', icon: Heading1 },
    { command: EditorCommand.Heading2, label: 'Заголовок 2', icon: Heading2 },
    { command: EditorCommand.Heading3, label: 'Заголовок 3', icon: Heading3 },
  ],
  [
    { command: EditorCommand.BulletedList, label: 'Маркований список', icon: List },
    { command: EditorCommand.NumberedList, label: 'Нумерований список', icon: ListOrdered },
    { command: EditorCommand.Checklist, label: 'Чекліст', icon: ListChecks },
    { command: EditorCommand.Quote, label: 'Цитата', icon: Quote },
    { command: EditorCommand.Code, label: 'Код', icon: Code },
  ],
]

/** Inline-форматування виконується нативною командою браузера, як і в самих inline-tools Blok. */
const INLINE_COMMANDS: Partial<Record<EditorCommand, string>> = {
  [EditorCommand.Bold]: 'bold',
  [EditorCommand.Italic]: 'italic',
  [EditorCommand.Underline]: 'underline',
  [EditorCommand.Strikethrough]: 'strikeThrough',
}

interface BlockConversion {
  tool: string
  data?: BlockToolData
}

const BLOCK_CONVERSIONS: Partial<Record<EditorCommand, BlockConversion>> = {
  [EditorCommand.Text]: { tool: 'paragraph' },
  [EditorCommand.Heading1]: { tool: 'header', data: { level: 1 } },
  [EditorCommand.Heading2]: { tool: 'header', data: { level: 2 } },
  [EditorCommand.Heading3]: { tool: 'header', data: { level: 3 } },
  [EditorCommand.BulletedList]: { tool: 'list', data: { style: 'unordered' } },
  [EditorCommand.NumberedList]: { tool: 'list', data: { style: 'ordered' } },
  [EditorCommand.Checklist]: { tool: 'list', data: { style: 'checklist' } },
  [EditorCommand.Quote]: { tool: 'quote' },
  [EditorCommand.Code]: { tool: 'code' },
}

/** Перетворює поточний блок і лишає каретку в ньому, щоб клавіатура не закрилась. */
async function convertCurrentBlock(blok: Blok, { tool, data }: BlockConversion) {
  const current = blok.blocks.getBlockByIndex(blok.blocks.getCurrentBlockIndex())
  if (!current) return

  try {
    const converted = await blok.blocks.convert(current.id, tool, data)
    blok.caret.setToBlock(converted, 'end')
  } catch (error) {
    // Не всі блоки конвертуються (зображення, таблиці…): це не помилка для користувача.
    console.warn(`Блок не можна перетворити на "${tool}"`, error)
  }
}

export async function runEditorCommand(blok: Blok, command: EditorCommand): Promise<void> {
  if (command === EditorCommand.Undo) return blok.history.undo()
  if (command === EditorCommand.Redo) return blok.history.redo()

  const inlineCommand = INLINE_COMMANDS[command]
  if (inlineCommand) {
    document.execCommand(inlineCommand)
    return
  }

  const conversion = BLOCK_CONVERSIONS[command]
  if (conversion) await convertCurrentBlock(blok, conversion)
}
