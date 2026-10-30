import type { JSONContent } from '@tiptap/vue-3'

/** Стабільний id top-level блока (його виставляє розширення UniqueID). */
export const getBlockId = (block: JSONContent) => block.attrs?.id as string | undefined
