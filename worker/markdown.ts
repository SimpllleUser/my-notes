/** Конвертація між блоками редактора (Blok) і Markdown. Текст блоків — `RichText` (масив фрагментів). */

export interface Block {
  id?: string
  type: string
  data: Record<string, unknown>
  [key: string]: unknown
}

interface Marks {
  bold?: true
  italic?: true
  strikethrough?: true
  code?: true
  link?: { href: string }
  [mark: string]: unknown
}

interface Segment {
  text: string
  marks?: Marks
}

// ——— RichText → Markdown ———

const wrapMarks = (text: string, marks: Marks = {}): string => {
  if (!text.trim()) return text
  let result = text
  if (marks.code) result = `\`${result}\``
  if (marks.strikethrough) result = `~~${result}~~`
  if (marks.italic) result = `*${result}*`
  if (marks.bold) result = `**${result}**`
  if (marks.link) result = `[${result}](${marks.link.href})`
  return result
}

const isSegment = (value: unknown): value is Segment =>
  typeof value === 'object' && value !== null && typeof (value as Segment).text === 'string'

/** Приймає і сучасний формат (масив фрагментів), і старий HTML-рядок. */
function richTextToMd(text: unknown): string {
  if (typeof text === 'string') return htmlToMd(text)
  if (!Array.isArray(text)) return ''
  return text
    .filter(isSegment)
    .map((segment) => wrapMarks(segment.text, segment.marks))
    .join('')
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

function htmlToMd(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, '[$2]($1)')
    .replace(/<(b|strong)\b[^>]*>(.*?)<\/\1>/gis, '**$2**')
    .replace(/<(i|em)\b[^>]*>(.*?)<\/\1>/gis, '*$2*')
    .replace(/<(s|strike|del)\b[^>]*>(.*?)<\/\1>/gis, '~~$2~~')
    .replace(/<code\b[^>]*>(.*?)<\/code>/gis, '`$1`')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity]!)
}

const clampHeadingLevel = (level: unknown) => Math.min(Math.max(Number(level) || 2, 1), 6)

export function blocksToMarkdown(blocks: Block[]): string {
  const lines: string[] = []
  let previous: Block | undefined
  const orderedCounters: number[] = []

  const startsNewParagraph = (block: Block) =>
    !(
      block.type === 'list' &&
      previous?.type === 'list' &&
      block.data.style === previous.data.style
    )

  for (const block of blocks) {
    if (block.type === 'table') continue // вміст клітинок іде окремими абзацами
    const { type, data } = block
    if (type !== 'list') orderedCounters.length = 0

    if (lines.length && startsNewParagraph(block)) lines.push('')
    lines.push(blockToMd(block, orderedCounters))
    previous = block
  }
  return lines.join('\n')
}

function blockToMd({ type, data }: Block, orderedCounters: number[]): string {
  const text = richTextToMd(data.text)
  switch (type) {
    case 'header':
      return `${'#'.repeat(clampHeadingLevel(data.level))} ${text}`
    case 'list':
      return listItemToMd(data, text, orderedCounters)
    case 'quote':
      return text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    case 'code':
      return `\`\`\`${data.language ?? ''}\n${String(data.code ?? '')}\n\`\`\``
    case 'divider':
      return '---'
    default:
      return text
  }
}

function listItemToMd(data: Block['data'], text: string, orderedCounters: number[]): string {
  const depth = Number(data.depth) || 0
  orderedCounters.length = depth + 1
  let marker = '-'
  if (data.style === 'ordered') {
    orderedCounters[depth] = (orderedCounters[depth] ?? 0) + 1
    marker = `${orderedCounters[depth]}.`
  } else if (data.style === 'checklist') {
    marker = `- [${data.checked ? 'x' : ' '}]`
  } else {
    orderedCounters[depth] = 0
  }
  return `${'  '.repeat(depth)}${marker} ${text}`
}

// ——— Markdown → RichText ———

/** Інлайн-розмітка у порядку пріоритету: код не розбирається всередині, решта вкладається. */
const INLINE_PATTERNS: { regex: RegExp; toMarks: (m: RegExpExecArray) => Marks; group: number }[] =
  [
    { regex: /`([^`]+)`/, toMarks: () => ({ code: true }), group: 1 },
    { regex: /\[([^\]]+)\]\(([^)\s]+)\)/, toMarks: (m) => ({ link: { href: m[2]! } }), group: 1 },
    { regex: /\*\*\*([^*]+)\*\*\*/, toMarks: () => ({ bold: true, italic: true }), group: 1 },
    { regex: /\*\*([^*]+)\*\*/, toMarks: () => ({ bold: true }), group: 1 },
    { regex: /(?<![*\w])\*([^*\s][^*]*)\*(?!\*)/, toMarks: () => ({ italic: true }), group: 1 },
    { regex: /~~([^~]+)~~/, toMarks: () => ({ strikethrough: true }), group: 1 },
  ]

function parseInline(text: string, inherited: Marks = {}): Segment[] {
  let earliest: { match: RegExpExecArray; pattern: (typeof INLINE_PATTERNS)[number] } | undefined
  for (const pattern of INLINE_PATTERNS) {
    const match = pattern.regex.exec(text)
    if (match && (!earliest || match.index < earliest.match.index)) earliest = { match, pattern }
  }
  if (!earliest) return text ? [toSegment(text, inherited)] : []

  const { match, pattern } = earliest
  const marks = { ...inherited, ...pattern.toMarks(match) }
  const inner = match[pattern.group]!
  return [
    ...parseInline(text.slice(0, match.index), inherited),
    ...(marks.code ? [toSegment(inner, marks)] : parseInline(inner, marks)),
    ...parseInline(text.slice(match.index + match[0].length), inherited),
  ]
}

const toSegment = (text: string, marks: Marks): Segment =>
  Object.keys(marks).length ? { text, marks } : { text }

const richText = (markdown: string): Segment[] => parseInline(markdown)

const newBlock = (type: string, data: Record<string, unknown>): Block => ({
  id: crypto.randomUUID(),
  type,
  data,
})

const CODE_FENCE = /^```\s*(\S*)\s*$/
const DIVIDER = /^\s*([-*_])(\s*\1){2,}\s*$/
const HEADING = /^(#{1,6})\s+(.*)$/
const LIST_ITEM = /^(\s*)(?:([-*+])|(\d+)[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/
const QUOTE = /^>\s?(.*)$/
const LIST_INDENT = 2

export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push(newBlock('paragraph', { text: richText(paragraph.join('\n')) }))
    paragraph = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    let match: RegExpMatchArray | null

    if ((match = line.match(CODE_FENCE))) {
      flushParagraph()
      const code: string[] = []
      while (++i < lines.length && !/^```\s*$/.test(lines[i]!)) code.push(lines[i]!)
      blocks.push(
        newBlock('code', { code: code.join('\n'), ...(match[1] ? { language: match[1] } : {}) }),
      )
    } else if (!line.trim()) {
      flushParagraph()
    } else if (DIVIDER.test(line)) {
      flushParagraph()
      blocks.push(newBlock('divider', {}))
    } else if ((match = line.match(HEADING))) {
      flushParagraph()
      blocks.push(newBlock('header', { text: richText(match[2]!.trim()), level: match[1]!.length }))
    } else if ((match = line.match(LIST_ITEM))) {
      flushParagraph()
      blocks.push(listBlock(match))
    } else if (QUOTE.test(line)) {
      flushParagraph()
      const quote = [line.match(QUOTE)![1]!]
      while (i + 1 < lines.length && QUOTE.test(lines[i + 1]!))
        quote.push(lines[++i]!.match(QUOTE)![1]!)
      blocks.push(newBlock('quote', { text: richText(quote.join('\n')), size: 'default' }))
    } else {
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  return blocks
}

function listBlock(match: RegExpMatchArray): Block {
  const [, indent = '', , ordinal, checkbox, text = ''] = match
  const depth = Math.floor(indent.replace(/\t/g, '  ').length / LIST_INDENT)
  const style = checkbox !== undefined ? 'checklist' : ordinal ? 'ordered' : 'unordered'
  return newBlock('list', {
    text: richText(text),
    style,
    ...(style === 'checklist' ? { checked: checkbox!.toLowerCase() === 'x' } : {}),
    ...(depth ? { depth } : {}),
  })
}
