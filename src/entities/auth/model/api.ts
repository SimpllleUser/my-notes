import type { SessionResponse, SignInResponse, SingInPayload } from '@/entities/auth/model/types.ts'
import { account } from '@/shared/api/appwrite.ts'
import type { Account, Models } from 'appwrite'

export class AuthAPI {
  private account: Account

  constructor(account: Account) {
    this.account = account
  }

  async signIn(payload: SingInPayload): Promise<SignInResponse> {
    try {
      const session = await this.account.createEmailPasswordSession(payload)
      return {
        session,
        error: null,
      }
    } catch (error) {
      return {
        session: null,
        error: error,
      }
    }
  }

  async getSession(): Promise<SessionResponse> {
    try {
      const user = await account.get()
      return { user, error: null }
    } catch (error) {
      return { user: null, error: error }
    }
  }
}

export const authAPI = new AuthAPI(account)
