/** Прив'язки й змінні Worker (див. wrangler.jsonc та .dev.vars.example). */
export interface Env {
  ASSETS: Fetcher
  MCP_TOKEN: string
  APPWRITE_API_KEY: string
  APPWRITE_ENDPOINT: string
  APPWRITE_PROJECT_ID: string
  APPWRITE_DATABASE_ID: string
  APPWRITE_FOLDER_TABLE_ID: string
  APPWRITE_NOTE_TABLE_ID: string
  APPWRITE_NODE_TABLE_ID: string
  /** Необов'язково: id користувача Appwrite, якому видаються права на створені рядки. */
  OWNER_USER_ID?: string
}
