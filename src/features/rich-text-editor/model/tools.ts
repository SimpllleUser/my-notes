import * as T from '@bloklabs/core/tools'
import { defaultBlockTools } from '@bloklabs/core/tools'
import { defaultInlineTools } from '@bloklabs/core/full'

/** Ключ = назва інструмента (як у defaultBlockTools), значення = клас. */
const classes: Record<string, unknown> = {
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

export const tools = Object.fromEntries(
  Object.entries(defaultBlockTools).map(([name, config]) => [
    name,
    { class: classes[name], ...config },
  ]),
)

export const inlineTools = {
  ...defaultInlineTools,
  link: T.Link,
}
