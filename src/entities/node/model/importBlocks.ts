import type { OutputBlockData } from '@bloklabs/core'

/** Блок у «деревному» форматі (type / props / content / children), який приймає імпорт. */
interface SourceBlock {
  id?: string
  type?: string
  props?: Record<string, unknown>
  content?: string | SourceInline[]
  children?: SourceBlock[]
}

interface SourceInline {
  type?: string
  text?: string
  href?: string
  styles?: Record<string, boolean>
  content?: string | SourceInline[]
}

type BlockBuilder = (source: SourceBlock, text: string) => Pick<OutputBlockData, 'type' | 'data'>

const LIST_STYLES = {
  bulletListItem: 'unordered',
  numberedListItem: 'ordered',
  checkListItem: 'checklist',
} as const

const STYLE_TAGS: Record<string, string> = {
  bold: 'b',
  italic: 'i',
  underline: 'u',
  strike: 's',
  code: 'code',
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const wrap = (tag: string, html: string, attrs = '') => `<${tag}${attrs}>${html}</${tag}>`

function inlineToHtml(inline: SourceInline): string {
  if (inline.type === 'link') {
    const label = contentToHtml(inline.content)
    return wrap('a', label, ` href="${escapeHtml(inline.href ?? '')}"`)
  }
  const html = escapeHtml(inline.text ?? '')
  return Object.entries(inline.styles ?? {}).reduce(
    (acc, [style, enabled]) => (enabled && STYLE_TAGS[style] ? wrap(STYLE_TAGS[style], acc) : acc),
    html,
  )
}

function contentToHtml(content: SourceBlock['content']): string {
  if (typeof content === 'string') return escapeHtml(content)
  return Array.isArray(content) ? content.map(inlineToHtml).join('') : ''
}

const clampLevel = (value: unknown) => Math.min(Math.max(Number(value) || 1, 1), 6)

const builders: Record<string, BlockBuilder> = {
  heading: ({ props }, text) => ({
    type: 'header',
    data: {
      text,
      level: clampLevel(props?.level),
      ...(props?.isToggleable ? { isToggleable: true } : {}),
    },
  }),
  quote: (_, text) => ({ type: 'quote', data: { text, size: 'default' } }),
  codeBlock: ({ props }, text) => ({
    type: 'code',
    data: { code: text, ...(props?.language ? { language: props.language } : {}) },
  }),
  divider: () => ({ type: 'divider', data: {} }),
}

function buildBlock(source: SourceBlock): Pick<OutputBlockData, 'type' | 'data'> {
  const text = contentToHtml(source.content)
  const listStyle = LIST_STYLES[source.type as keyof typeof LIST_STYLES]
  if (listStyle) {
    const checked = listStyle === 'checklist' ? { checked: Boolean(source.props?.checked) } : {}
    return { type: 'list', data: { text, style: listStyle, ...checked } }
  }
  return builders[source.type ?? '']?.(source, text) ?? { type: 'paragraph', data: { text } }
}

const isListItem = (source: SourceBlock) => source.type! in LIST_STYLES
const isToggleHeading = (source: SourceBlock) =>
  source.type === 'heading' && Boolean(source.props?.isToggleable)

/**
 * Дочірні блоки: у toggle-заголовка вони вкладаються (`parent` / `content`),
 * у елемента списку — зсуваються на рівень глибше, в решти — стають сусідніми.
 */
function convertBlock(source: SourceBlock, parentId: string | undefined, depth: number): OutputBlockData[] {
  const id = crypto.randomUUID()
  const { type, data } = buildBlock(source)
  const children = source.children ?? []
  const ownDepth = isListItem(source) && depth > 0 ? { depth } : {}

  const block: OutputBlockData = {
    id,
    type,
    data: { ...data, ...ownDepth },
    ...(parentId ? { parent: parentId } : {}),
  }

  if (isToggleHeading(source)) {
    const nested = convertBlocks(children, id, 0)
    block.content = nested.filter((child) => child.parent === id).map((child) => child.id!)
    return [block, ...nested]
  }
  const childDepth = isListItem(source) ? depth + 1 : depth
  return [block, ...convertBlocks(children, parentId, childDepth)]
}

function convertBlocks(sources: SourceBlock[], parentId: string | undefined, depth: number): OutputBlockData[] {
  return sources.flatMap((source) => convertBlock(source, parentId, depth))
}

/** Розбирає JSON-текст імпорту; кидає зрозумілу помилку, якщо формат не підходить. */
export function parseImportedBlocks(json: string): OutputBlockData[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Некоректний JSON')
  }
  if (!Array.isArray(parsed) || !parsed.length) {
    throw new Error('Очікується непорожній масив блоків')
  }
  return convertBlocks(parsed as SourceBlock[], undefined, 0)
}
