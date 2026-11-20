import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import type { Env } from './env'
import { Notes } from './notes'

/** Формат id в Appwrite: захищає від підміни шляху запиту (`../`, `?`, `#`) через аргументи tools. */
const id = z.string().regex(/^[A-Za-z0-9_][A-Za-z0-9._-]{0,35}$/, 'Некоректний id')

const json = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
})

const run = async (fn: () => Promise<unknown>) => {
  try {
    return json(await fn())
  } catch (error) {
    return {
      isError: true,
      content: [
        { type: 'text' as const, text: error instanceof Error ? error.message : String(error) },
      ],
    }
  }
}

function createServer(env: Env) {
  const notes = new Notes(env)
  const server = new McpServer({ name: 'my-notes', version: '0.1.0' })
  const readOnly = { readOnlyHint: true, openWorldHint: false }

  server.registerTool(
    'list_folders',
    { description: 'Список усіх папок із нотатками.', annotations: readOnly },
    () => run(() => notes.listFolders()),
  )

  server.registerTool(
    'list_notes',
    {
      description: 'Нотатки в папці (без вмісту).',
      inputSchema: { folderId: id.describe('id папки з list_folders') },
      annotations: readOnly,
    },
    ({ folderId }) => run(() => notes.listNotes(folderId)),
  )

  server.registerTool(
    'search_notes',
    {
      description: 'Пошук нотаток за частиною назви (до 50 результатів).',
      inputSchema: { query: z.string().min(1) },
      annotations: readOnly,
    },
    ({ query }) => run(() => notes.searchNotes(query)),
  )

  server.registerTool(
    'read_note',
    {
      description: 'Вміст нотатки у вигляді Markdown.',
      inputSchema: { noteId: id },
      annotations: readOnly,
    },
    ({ noteId }) => run(() => notes.readNote(noteId)),
  )

  server.registerTool(
    'create_note',
    {
      description: 'Створює нотатку в папці. Вміст — Markdown.',
      inputSchema: {
        folderId: id,
        name: z.string().min(1).max(200),
        markdown: z.string().max(100_000).default(''),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    ({ folderId, name, markdown }) => run(() => notes.createNote(folderId, name, markdown)),
  )

  server.registerTool(
    'append_to_note',
    {
      description: 'Дописує Markdown у кінець наявної нотатки. Наявний вміст не змінюється.',
      inputSchema: { noteId: id, markdown: z.string().min(1).max(100_000) },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    ({ noteId, markdown }) => run(() => notes.appendToNote(noteId, markdown)),
  )

  server.registerTool(
    'update_note',
    {
      description:
        'Редагує нотатку: перейменування (name), переміщення в іншу папку (folderId) та/або ПОВНА заміна вмісту (markdown). ' +
        'Передавай лише те, що треба змінити. Щоб змінити частину тексту, спершу прочитай нотатку через read_note ' +
        'і надішли повний оновлений Markdown. Для дописування в кінець краще append_to_note.',
      inputSchema: {
        noteId: id,
        name: z.string().min(1).max(200).optional(),
        folderId: id.optional(),
        markdown: z.string().max(100_000).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ noteId, ...changes }) =>
      run(async () => {
        if (!Object.values(changes).some((v) => v !== undefined)) {
          throw new Error('Вкажи хоча б одне з полів: name, folderId, markdown')
        }
        return notes.updateNote(noteId, changes)
      }),
  )

  return server
}

/** Stateless Streamable HTTP: новий сервер і транспорт на кожен запит. */
export async function handleMcp(request: Request, env: Env): Promise<Response> {
  const server = createServer(env)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  return transport.handleRequest(request)
}
