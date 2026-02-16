import { useEffect, useState } from 'react'

/**
 * Simple auth hook that manages access token from localStorage
 */
export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  return {
    accessToken,
    isAuthenticated: !!accessToken,
  }
}
