import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: async (email: string, password: string) => {
        // Mock login - in production, call API
        if (email === 'admin@gaztime.co.za' && password === 'admin123') {
          set({
            isAuthenticated: true,
            user: {
              id: 'admin-1',
              name: 'Admin User',
              email: 'admin@gaztime.co.za',
              role: 'Super Admin',
            },
          })
          return true
        }
        return false
      },
      logout: () => {
        set({ isAuthenticated: false, user: null })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
