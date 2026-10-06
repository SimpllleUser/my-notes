import type { Nullable } from '@/shared/model/types.ts'
import type { Models } from 'appwrite'

export interface SingInPayload {
  email: string;
  password: string;
}

export interface SignInResponse {
  session: Nullable<Models.Session>
  error: Nullable<unknown>
}

export interface SessionResponse {
  user: Nullable<Models.User>
  error: unknown
}
