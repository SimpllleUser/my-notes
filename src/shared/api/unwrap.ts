import type { APIResponse } from '@/shared/model/types.ts'

/** Перетворює `{ data, error }` на значення або кидає помилку. */
export async function unwrap<T>(response: APIResponse<T>): Promise<T> {
  const { data, error } = await response
  if (error || data === null) throw error ?? new Error('Empty API response')
  return data
}
