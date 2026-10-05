import { Node, mergeAttributes } from '@tiptap/core'

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return { emoji: { default: '💡' }, tone: { default: 'yellow' } }
  },
  parseHTML() {
    return [{ tag: 'aside[data-type="callout"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }),
      ['span', { class: 'callout-emoji' }, HTMLAttributes.emoji],
      ['div', { class: 'callout-content' }, 0],
    ]
  },
})
