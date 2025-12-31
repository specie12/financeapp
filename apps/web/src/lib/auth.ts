'use client'

import { createApiClient, type ApiClient } from '@finance-app/api-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refreshToken')
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    clearTokens()
    throw new Error('Failed to refresh token')
  }

  const data = await response.json()
  const newAccessToken = data.data.accessToken
  const newRefreshToken = data.data.refreshToken

  setTokens(newAccessToken, newRefreshToken)
  return newAccessToken
}

export function createAuthenticatedApiClient(accessToken: string | null): ApiClient {
  const apiClient = createApiClient({
    baseURL: API_BASE_URL,
    onTokenRefresh: refreshAccessToken,
    onAuthError: () => {
      clearTokens()
      // Redirect to onboarding/login
      if (typeof window !== 'undefined') {
        window.location.href = '/onboarding'
      }
    },
  })

  if (accessToken) {
    apiClient.setAccessToken(accessToken)
  }

  return apiClient
}
