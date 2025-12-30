import * as SecureStore from 'expo-secure-store'
import { createApiClient, type ApiClient } from '@finance-app/api-client'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

// API base URL - in production, this would come from environment config
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

let apiClientInstance: ApiClient | null = null
let storedRefreshToken: string | null = null

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
    storedRefreshToken = token
    return token
  } catch {
    return null
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  storedRefreshToken = token
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)
}

export async function clearTokens(): Promise<void> {
  storedRefreshToken = null
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
}

export async function getApiClient(): Promise<ApiClient> {
  if (!apiClientInstance) {
    // Pre-load refresh token
    await getRefreshToken()

    apiClientInstance = createApiClient({
      baseURL: API_BASE_URL,
      timeout: 30000,
      onTokenRefresh: async () => {
        // Use the stored refresh token to get a new access token
        if (!storedRefreshToken) {
          throw new Error('No refresh token available')
        }
        const tempClient = createApiClient({ baseURL: API_BASE_URL })
        const response = await tempClient.auth.refreshToken(storedRefreshToken)
        const newAccessToken = response.data.accessToken
        await setAccessToken(newAccessToken)
        if (response.data.refreshToken) {
          await setRefreshToken(response.data.refreshToken)
        }
        return newAccessToken
      },
      onAuthError: async () => {
        await clearTokens()
      },
    })
  }

  // Always refresh the token from secure store
  const token = await getAccessToken()
  if (token) {
    apiClientInstance.setAccessToken(token)
  }

  return apiClientInstance
}

export function resetApiClient(): void {
  if (apiClientInstance) {
    apiClientInstance.clearAccessToken()
  }
  apiClientInstance = null
}
