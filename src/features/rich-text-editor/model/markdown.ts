import type { Editor } from '@tiptap/vue-3'

const MARKDOWN_BLOCK_OR_INLINE =
  /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|~~~|---\s*$)|\*\*[^*]+\*\*|__[^_]+__|\[[^\]]+\]\([^\s)]+\)/m
const MARKDOWN_TABLE =
  /\|.*\|[ \t]*\n[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*(\n|$)/m

export function looksLikeMarkdown(value: string) {
  return MARKDOWN_BLOCK_OR_INLINE.test(value) || MARKDOWN_TABLE.test(value)
}

/** Вставляє текст з буфера як markdown. Повертає `true`, якщо вставку оброблено. */
export function pasteMarkdown(editor: Editor | undefined, event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text/plain') ?? ''
  const html = event.clipboardData?.getData('text/html') ?? ''
  const isPlainMarkdown = text && (!html || looksLikeMarkdown(text))
  if (!editor?.markdown || !isPlainMarkdown) return false

  event.preventDefault()
  event.stopPropagation()
  const parsed = editor.markdown.parse(text)
  editor.commands.insertContent(parsed.type === 'doc' ? (parsed.content ?? []) : parsed)
  return true
}
