import { StatusTone } from '@/shared/model/enums.ts'

export enum SyncStatus {
  Saved = 'saved',
  Saving = 'saving',
  Error = 'error',
}

export interface StatusView {
  status: SyncStatus
  label: string
  tone: StatusTone
}

const VIEWS: Record<SyncStatus, StatusView> = {
  [SyncStatus.Saved]: { status: SyncStatus.Saved, label: 'Saved', tone: StatusTone.Success },
  [SyncStatus.Saving]: { status: SyncStatus.Saving, label: 'Saving…', tone: StatusTone.Success },
  [SyncStatus.Error]: {
    status: SyncStatus.Error,
    label: 'Error of saving',
    tone: StatusTone.Neutral,
  },
}

export const getSyncStatusView = (status: SyncStatus) => VIEWS[status]
