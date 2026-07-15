import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  userName: string | null
  setUserName: (name: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userName: null,
      setUserName: (name) => set({ userName: name }),
      logout: () => set({ userName: null }),
    }),
    {
      name: 'er_user_store', // Key name in LocalStorage
    }
  )
)
