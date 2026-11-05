import * as T from '@bloklabs/core/tools'
import { defaultBlockTools } from '@bloklabs/core/tools'
import { defaultInlineTools } from '@bloklabs/core/full'
import type { BlokConfig, ToolConstructable } from '@bloklabs/core'

/** Ключ = назва інструмента (як у defaultBlockTools), значення = клас. */
const classes: Record<string, ToolConstructable> = {
  paragraph: T.Paragraph,
  header: T.Header,
  list: T.List,
  table: T.Table,
  toggle: T.Toggle,
  callout: T.Callout,
  database: T.Database,
  'database-row': T.DatabaseRow,
  divider: T.Divider,
  spacer: T.Spacer,
  table_of_contents: T.TableOfContents,
  quote: T.Quote,
  code: T.Code,
  image: T.Image,
  file: T.File,
  audio: T.Audio,
  video: T.Video,
  column_list: T.ColumnList,
  column: T.Column,
  tabs: T.Tabs,
  tab: T.TabTool,
  embed: T.Embed,
  bookmark: T.Bookmark,
}

const blockTools = Object.fromEntries(
  Object.entries(defaultBlockTools).map(([name, config]) => [
    name,
    { class: classes[name], ...config },
  ]),
)

const inlineClasses: Record<string, ToolConstructable> = {
  bold: T.Bold,
  italic: T.Italic,
  link: T.Link,
  marker: T.Marker,
  strikethrough: T.Strikethrough,
  underline: T.Underline,
  inlineCode: T.InlineCode,
  equation: T.Equation,
  supSub: T.SupSub,
}

const inlineTools = {
  ...defaultInlineTools,
}

const inlineToolSettings = Object.fromEntries(
  Object.entries(inlineTools).map(([name, config]) => [
    name,
    { class: inlineClasses[name], ...config },
  ]),
)

export const tools: NonNullable<BlokConfig['tools']> = {
  ...blockTools,
  ...inlineToolSettings,
}

export const inlineToolbar: NonNullable<BlokConfig['inlineToolbar']> = Object.keys(inlineTools)
