import { StatusTone } from '@/shared/model/enums.ts'

export enum SyncStatus {
  Saved = 'saved',
  Saving = 'saving',
  Error = 'error',
}

const VIEWS: Record<SyncStatus, { label: string; tone: StatusTone }> = {
  [SyncStatus.Saved]: { label: 'Saved', tone: StatusTone.Success },
  [SyncStatus.Saving]: { label: 'Saving…', tone: StatusTone.Success },
  [SyncStatus.Error]: { label: 'Error of saving', tone: StatusTone.Neutral },
}

export const getSyncStatusView = (status: SyncStatus) => VIEWS[status]
