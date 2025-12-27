import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import type {
  User,
  Account,
  Transaction,
  Category,
  Budget,
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
  CreateAccountDto,
  CreateTransactionDto,
  CreateCategoryDto,
  CreateBudgetDto,
  LoginCredentials,
  AuthTokens,
  AuthUser,
} from '@finance-app/shared-types'

// ============================================
// Types
// ============================================

export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  onTokenRefresh?: () => Promise<string>
  onAuthError?: () => void
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface TransactionFilters extends PaginationParams {
  accountId?: string
  categoryId?: string
  type?: 'income' | 'expense' | 'transfer'
  startDate?: Date
  endDate?: Date
}

// ============================================
// API Client Class
// ============================================

export class ApiClient {
  private client: AxiosInstance
  private accessToken: string | null = null
  private config: ApiClientConfig

  constructor(config: ApiClientConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error: AxiosError) => Promise.reject(error),
    )

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          if (this.config.onTokenRefresh) {
            try {
              const newToken = await this.config.onTokenRefresh()
              this.setAccessToken(newToken)

              // Retry the original request
              const originalRequest = error.config
              if (originalRequest) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return this.client(originalRequest)
              }
            } catch {
              this.config.onAuthError?.()
            }
          } else {
            this.config.onAuthError?.()
          }
        }
        return Promise.reject(error)
      },
    )
  }

  // ============================================
  // Token Management
  // ============================================

  setAccessToken(token: string): void {
    this.accessToken = token
  }

  clearAccessToken(): void {
    this.accessToken = null
  }

  // ============================================
  // Auth Endpoints
  // ============================================

  auth = {
    login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> => {
      const response = await this.client.post<ApiResponse<AuthTokens>>('/auth/login', credentials)
      return response.data
    },

    register: async (data: {
      email: string
      password: string
      firstName: string
      lastName: string
    }): Promise<ApiResponse<AuthUser>> => {
      const response = await this.client.post<ApiResponse<AuthUser>>('/auth/register', data)
      return response.data
    },

    refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
      const response = await this.client.post<ApiResponse<AuthTokens>>('/auth/refresh', {
        refreshToken,
      })
      return response.data
    },

    logout: async (): Promise<void> => {
      await this.client.post('/auth/logout')
      this.clearAccessToken()
    },

    me: async (): Promise<ApiResponse<AuthUser>> => {
      const response = await this.client.get<ApiResponse<AuthUser>>('/auth/me')
      return response.data
    },
  }

  // ============================================
  // User Endpoints
  // ============================================

  users = {
    getProfile: async (): Promise<ApiResponse<User>> => {
      const response = await this.client.get<ApiResponse<User>>('/users/profile')
      return response.data
    },

    updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
      const response = await this.client.patch<ApiResponse<User>>('/users/profile', data)
      return response.data
    },
  }

  // ============================================
  // Account Endpoints
  // ============================================

  accounts = {
    list: async (params?: PaginationParams): Promise<PaginatedResponse<Account>> => {
      const response = await this.client.get<PaginatedResponse<Account>>('/accounts', { params })
      return response.data
    },

    get: async (id: string): Promise<ApiResponse<Account>> => {
      const response = await this.client.get<ApiResponse<Account>>(`/accounts/${id}`)
      return response.data
    },

    create: async (data: CreateAccountDto): Promise<ApiResponse<Account>> => {
      const response = await this.client.post<ApiResponse<Account>>('/accounts', data)
      return response.data
    },

    update: async (id: string, data: Partial<CreateAccountDto>): Promise<ApiResponse<Account>> => {
      const response = await this.client.patch<ApiResponse<Account>>(`/accounts/${id}`, data)
      return response.data
    },

    delete: async (id: string): Promise<void> => {
      await this.client.delete(`/accounts/${id}`)
    },
  }

  // ============================================
  // Transaction Endpoints
  // ============================================

  transactions = {
    list: async (filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> => {
      const response = await this.client.get<PaginatedResponse<Transaction>>('/transactions', {
        params: filters,
      })
      return response.data
    },

    get: async (id: string): Promise<ApiResponse<Transaction>> => {
      const response = await this.client.get<ApiResponse<Transaction>>(`/transactions/${id}`)
      return response.data
    },

    create: async (data: CreateTransactionDto): Promise<ApiResponse<Transaction>> => {
      const response = await this.client.post<ApiResponse<Transaction>>('/transactions', data)
      return response.data
    },

    update: async (
      id: string,
      data: Partial<CreateTransactionDto>,
    ): Promise<ApiResponse<Transaction>> => {
      const response = await this.client.patch<ApiResponse<Transaction>>(
        `/transactions/${id}`,
        data,
      )
      return response.data
    },

    delete: async (id: string): Promise<void> => {
      await this.client.delete(`/transactions/${id}`)
    },
  }

  // ============================================
  // Category Endpoints
  // ============================================

  categories = {
    list: async (params?: PaginationParams): Promise<PaginatedResponse<Category>> => {
      const response = await this.client.get<PaginatedResponse<Category>>('/categories', { params })
      return response.data
    },

    get: async (id: string): Promise<ApiResponse<Category>> => {
      const response = await this.client.get<ApiResponse<Category>>(`/categories/${id}`)
      return response.data
    },

    create: async (data: CreateCategoryDto): Promise<ApiResponse<Category>> => {
      const response = await this.client.post<ApiResponse<Category>>('/categories', data)
      return response.data
    },

    update: async (
      id: string,
      data: Partial<CreateCategoryDto>,
    ): Promise<ApiResponse<Category>> => {
      const response = await this.client.patch<ApiResponse<Category>>(`/categories/${id}`, data)
      return response.data
    },

    delete: async (id: string): Promise<void> => {
      await this.client.delete(`/categories/${id}`)
    },
  }

  // ============================================
  // Budget Endpoints
  // ============================================

  budgets = {
    list: async (params?: PaginationParams): Promise<PaginatedResponse<Budget>> => {
      const response = await this.client.get<PaginatedResponse<Budget>>('/budgets', { params })
      return response.data
    },

    get: async (id: string): Promise<ApiResponse<Budget>> => {
      const response = await this.client.get<ApiResponse<Budget>>(`/budgets/${id}`)
      return response.data
    },

    create: async (data: CreateBudgetDto): Promise<ApiResponse<Budget>> => {
      const response = await this.client.post<ApiResponse<Budget>>('/budgets', data)
      return response.data
    },

    update: async (id: string, data: Partial<CreateBudgetDto>): Promise<ApiResponse<Budget>> => {
      const response = await this.client.patch<ApiResponse<Budget>>(`/budgets/${id}`, data)
      return response.data
    },

    delete: async (id: string): Promise<void> => {
      await this.client.delete(`/budgets/${id}`)
    },
  }
}

// ============================================
// Factory Function
// ============================================

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config)
}

// Re-export types for convenience
export type { AxiosError, AxiosRequestConfig }
