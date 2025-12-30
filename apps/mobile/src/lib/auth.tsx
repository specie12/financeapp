import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser } from '@finance-app/shared-types'
import {
  getApiClient,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  resetApiClient,
} from './api'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const token = await getAccessToken()
      if (!token) {
        setUser(null)
        return
      }

      const apiClient = await getApiClient()
      const response = await apiClient.auth.me()
      setUser(response.data)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      await clearTokens()
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await refreshUser()
      setIsLoading(false)
    }
    initAuth()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const apiClient = await getApiClient()
    const response = await apiClient.auth.login({ email, password })

    await setAccessToken(response.data.accessToken)
    if (response.data.refreshToken) {
      await setRefreshToken(response.data.refreshToken)
    }

    apiClient.setAccessToken(response.data.accessToken)

    // Fetch user info after login
    const userResponse = await apiClient.auth.me()
    setUser(userResponse.data)
  }

  const logout = async () => {
    try {
      const apiClient = await getApiClient()
      await apiClient.auth.logout()
    } catch {
      // Ignore logout errors
    }
    await clearTokens()
    resetApiClient()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
