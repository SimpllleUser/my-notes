import type { FileTreeNodeType } from '@/shared/model/enums.ts'

export type FileTreeNode = {
  id: string
  label: string
  type: FileTreeNodeType
  children?: FileTreeNode[]
  disabled?: boolean
}
