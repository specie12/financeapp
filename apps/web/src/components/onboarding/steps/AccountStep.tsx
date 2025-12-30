'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { accountStepSchema, type AccountStepInput } from '@/lib/onboarding/schemas'
import { StepContainer } from '../shared/StepContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createApiClient } from '@finance-app/api-client'
import type { AuthUser, AuthTokens } from '@finance-app/shared-types'

interface AccountStepProps {
  onSuccess: (user: AuthUser, tokens: AuthTokens) => void
  isLoading: boolean
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function AccountStep({ onSuccess, isLoading, setLoading, setError }: AccountStepProps) {
  const form = useForm<AccountStepInput>({
    resolver: zodResolver(accountStepSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: AccountStepInput) => {
    setLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      })

      // Register the user
      const registerResponse = await apiClient.auth.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })

      // Login to get tokens
      const loginResponse = await apiClient.auth.login({
        email: data.email,
        password: data.password,
      })

      onSuccess(registerResponse.data, loginResponse.data)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <StepContainer
      title="Create Your Account"
      description="Let's get started with your basic information"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Create a strong password" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account & Continue'}
            </Button>
          </div>
        </form>
      </Form>
    </StepContainer>
  )
}
