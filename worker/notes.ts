import { AppwriteTable, q, type Row } from './appwrite'
import type { Env } from './env'
import { blocksToMarkdown, markdownToBlocks, type Block } from './markdown'

interface StoredNode {
  rowId: string
  order: number
  block: Block
}

/** Скільки запитів до Appwrite виконуємо одночасно, щоб не впертись у ліміт підзапитів Worker. */
const WRITE_CONCURRENCY = 5

const inBatches = async <T>(items: T[], task: (item: T, index: number) => Promise<unknown>) => {
  for (let start = 0; start < items.length; start += WRITE_CONCURRENCY) {
    const batch = items.slice(start, start + WRITE_CONCURRENCY)
    await Promise.all(batch.map((item, offset) => task(item, start + offset)))
  }
}

/** Вкладені блоки (toggle, клітинки таблиці) зв'язані за id, тому на місці їх переписувати не можна. */
const hasStructure = (block: Block): boolean =>
  block.type === 'table' || 'parent' in block || 'content' in block

const serializeBlock = (block: Block, order: number) => JSON.stringify({ ...block, order })

const parseNode = (row: Row, index: number): StoredNode | null => {
  try {
    const { order, ...block } = JSON.parse(String(row.body))
    return {
      rowId: row.$id,
      order: Number(order ?? index),
      block: isBlock(block) ? block : legacyBlock(block),
    }
  } catch {
    return null
  }
}

interface LegacyNode {
  type?: string
  text?: string
  content?: LegacyNode[]
  attrs?: { level?: number }
}

const legacyText = (node: LegacyNode): string =>
  node.text ?? node.content?.map(legacyText).join('') ?? ''

/** Рядки, збережені ще Tiptap-ом: лишаємо текст абзаців і заголовків. */
const legacyBlock = (raw: LegacyNode): Block =>
  raw.type === 'heading'
    ? { type: 'header', data: { text: legacyText(raw), level: raw.attrs?.level ?? 2 } }
    : { type: 'paragraph', data: { text: legacyText(raw) } }

const isBlock = (value: Block): boolean =>
  typeof value.type === 'string' && typeof value.data === 'object' && value.data !== null

export class Notes {
  private folders: AppwriteTable
  private notes: AppwriteTable
  private nodes: AppwriteTable

  constructor(env: Env) {
    this.folders = new AppwriteTable(env, env.APPWRITE_FOLDER_TABLE_ID)
    this.notes = new AppwriteTable(env, env.APPWRITE_NOTE_TABLE_ID)
    this.nodes = new AppwriteTable(env, env.APPWRITE_NODE_TABLE_ID)
  }

  async listFolders() {
    const rows = await this.folders.listAll()
    return rows.map((r) => ({ id: r.$id, name: r.name, icon: r.icon, color: r.color }))
  }

  private summarize(r: Row) {
    return { id: r.$id, name: r.name, folderId: r.folder, updatedAt: r.$updatedAt }
  }

  async listNotes(folderId: string) {
    const rows = await this.notes.listAll([q.equal('folder', folderId)])
    return rows.map((r) => this.summarize(r))
  }

  async searchNotes(query: string) {
    const rows = await this.notes.list([q.contains('name', query), q.limit(50)])
    return rows.map((r) => this.summarize(r))
  }

  private async loadNodes(noteId: string): Promise<StoredNode[]> {
    const rows = await this.nodes.listAll([q.equal('note', noteId)])
    return rows
      .map(parseNode)
      .filter((n): n is StoredNode => n !== null)
      .sort((a, b) => a.order - b.order)
  }

  async readNote(noteId: string) {
    const [note, nodes] = await Promise.all([this.notes.get(noteId), this.loadNodes(noteId)])
    return {
      ...this.summarize(note),
      markdown: blocksToMarkdown(nodes.map((n) => n.block)),
    }
  }

  private writeBlocks(noteId: string, blocks: Block[], startOrder: number) {
    return inBatches(blocks, (block, index) =>
      this.nodes.create({ note: noteId, body: serializeBlock(block, startOrder + index) }),
    )
  }

  async createNote(folderId: string, name: string, markdown: string) {
    const note = await this.notes.create({ name, folder: folderId })
    await this.writeBlocks(note.$id, markdownToBlocks(markdown), 0)
    return this.summarize(note)
  }

  async appendToNote(noteId: string, markdown: string) {
    await this.notes.get(noteId) // не створюємо «осиротілі» вузли для неіснуючої нотатки
    const nodes = await this.loadNodes(noteId)
    const next = nodes.length ? Math.max(...nodes.map((n) => n.order)) + 1 : 0
    const blocks = markdownToBlocks(markdown)
    await this.writeBlocks(noteId, blocks, next)
    return { noteId, appendedBlocks: blocks.length }
  }

  /** Редагування нотатки: назва, папка та/або повна заміна вмісту. */
  async updateNote(
    noteId: string,
    changes: { name?: string; folderId?: string; markdown?: string },
  ) {
    const noteChanges: Record<string, unknown> = {}
    if (changes.name !== undefined) noteChanges.name = changes.name
    if (changes.folderId !== undefined) noteChanges.folder = changes.folderId
    const note = Object.keys(noteChanges).length
      ? await this.notes.update(noteId, noteChanges)
      : await this.notes.get(noteId)

    if (changes.markdown !== undefined) await this.replaceContent(noteId, changes.markdown)
    return this.summarize(note)
  }

  /** Наявні рядки оновлюються за позицією, бракуючі створюються, зайві видаляються. */
  private async replaceContent(noteId: string, markdown: string) {
    const existing = await this.loadNodes(noteId)
    if (existing.some(({ block }) => hasStructure(block))) {
      throw new Error(
        'Нотатка містить toggle-заголовки або таблиці: заміна вмісту їх пошкодить. Використай append_to_note або редагуй у застосунку.',
      )
    }
    const blocks = markdownToBlocks(markdown)
    const reusable = Math.min(existing.length, blocks.length)

    await inBatches(blocks.slice(0, reusable), (block, index) =>
      this.nodes.update(existing[index]!.rowId, { body: serializeBlock(block, index) }),
    )
    await this.writeBlocks(noteId, blocks.slice(reusable), reusable)
    await inBatches(existing.slice(reusable), (node) => this.nodes.delete(node.rowId))
  }
}
