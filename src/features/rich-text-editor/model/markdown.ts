import type { Editor, JSONContent } from '@tiptap/vue-3'

const MARKDOWN_BLOCK_OR_INLINE =
  /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|~~~|---\s*$)|\*\*[^*]+\*\*|__[^_]+__|\[[^\]]+\]\([^\s)]+\)/m
const MARKDOWN_TABLE =
  /\|.*\|[ \t]*\n[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*(\n|$)/m
const INLINE_MARK_SELECTOR = 'strong,b,em,i,u,s,del,a,mark'

export function looksLikeMarkdown(value: string) {
  return MARKDOWN_BLOCK_OR_INLINE.test(value) || MARKDOWN_TABLE.test(value)
}

/** Вставляє текст з буфера як markdown. Повертає `true`, якщо вставку оброблено. */
export function pasteMarkdown(editor: Editor | undefined, event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text/plain') ?? ''
  const html = event.clipboardData?.getData('text/html') ?? ''
  const isPlainMarkdown = text && (!html || looksLikeMarkdown(text))
  if (!editor) return false

  if (html && !isPlainMarkdown) {
    const sanitizedHtml = sanitizePastedHtml(html)
    if (sanitizedHtml === html) return false

    event.preventDefault()
    event.stopPropagation()
    editor.commands.insertContent(sanitizedHtml)
    return true
  }

  if (!editor.markdown || !isPlainMarkdown) return false

  event.preventDefault()
  event.stopPropagation()
  const parsed = normalizeConflictingMarks(editor.markdown.parse(text))
  editor.commands.insertContent(parsed.type === 'doc' ? (parsed.content ?? []) : parsed)
  return true
}

function normalizeConflictingMarks(node: JSONContent): JSONContent {
  const marks = node.marks?.filter((mark) => mark.type !== 'code' || node.marks?.length === 1)
  const content = node.content?.map(normalizeConflictingMarks)
  return { ...node, ...(marks ? { marks } : {}), ...(content ? { content } : {}) }
}

/**
 * Code marks cannot be combined with other inline marks in ProseMirror.
 * Notion can produce exactly that shape, for example `<strong><code>...</code></strong>`.
 * Keep the readable formatting and unwrap only the conflicting code mark.
 */
export function sanitizePastedHtml(html: string) {
  if (typeof DOMParser === 'undefined') return html

  const document = new DOMParser().parseFromString(html, 'text/html')
  let changed = false

  document.querySelectorAll('code').forEach((code) => {
    const hasNestedInlineMark = code.querySelector(INLINE_MARK_SELECTOR)
    const hasInlineMarkParent = code.parentElement?.closest(INLINE_MARK_SELECTOR)
    if (!hasNestedInlineMark && !hasInlineMarkParent) return

    code.replaceWith(...Array.from(code.childNodes))
    changed = true
  })

  return changed ? document.body.innerHTML : html
}
