import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import UniqueID from '@tiptap/extension-unique-id'
import { Markdown } from '@tiptap/markdown'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import { Callout } from './callout'
import { Toggle } from './toggle'

export function createExtensions(getPlaceholder: () => string) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: { HTMLAttributes: { class: 'notion-code-block' } },
      dropcursor: { color: '#f3c400', width: 3 },
    }),
    UniqueID.configure({ types: ['heading', 'paragraph'] }),
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Callout,
    Toggle,
    Image.configure({ inline: true, allowBase64: true }),
    Markdown.configure({ markedOptions: { gfm: true, breaks: false } }),
    Underline,
    Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: true, lastColumnResizable: true } }),
    Placeholder.configure({
      placeholder: ({ node }) => (node.type.name === 'heading' ? 'Заголовок' : getPlaceholder()),
      showOnlyCurrent: false,
    }),
    CharacterCount,
  ]
}
