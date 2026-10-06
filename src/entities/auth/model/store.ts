import { defineStore } from 'pinia'
import type { SingInPayload } from '@/entities/auth/model/types.ts'
import { authAPI } from '@/entities/auth/model/api.ts'
import type { Nullable } from '@/shared/model/types.ts'
import type { Models } from 'appwrite'

export const useAuthStore = defineStore('auth', {
  state: () =>
    ({
      user: null,
      session: null,
    }) as {
      user: Nullable<Models.User>
      session: Nullable<Models.Session>
    },

  getters: {
    isAuthed: (state) => state.user?.$id || state.session?.$id
  },
  actions: {
    async signIn(payload: SingInPayload) {
      const { session, error } = await authAPI.signIn(payload)
      if (session) {
        this.session = session
      } else  {
        console.log(error)
      }
    },
    async getSession() {
      const { user, error } = await authAPI.getSession()
      if (user) {
        this.user = user
      } else {
        console.log(error)
      }
    }
  },
})
