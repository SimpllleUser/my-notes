import { StatusTone } from '@/shared/model/enums.ts'

export type SyncStatus = 'saved' | 'saving' | 'error'

const VIEWS: Record<SyncStatus, { label: string; tone: StatusTone }> = {
  saved: { label: 'Saved', tone: StatusTone.Success },
  saving: { label: 'Saving…', tone: StatusTone.Success },
  error: { label: 'Error of saving', tone: StatusTone.Muted },
}

export const getSyncStatusView = (status: SyncStatus) => VIEWS[status]
