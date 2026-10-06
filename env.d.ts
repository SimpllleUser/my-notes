/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_PROJECT_NAME: string
  readonly APPWRITE_PROJECT_NAME: string
  readonly APPWRITE_ENDPOINT: string
  readonly APPWRITE_DATABASE_ID: string
  readonly APPWRITE_COLLECTION_FOLDER_ID: string
  readonly APPWRITE_COLLECTION_NODE_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
