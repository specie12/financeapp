'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface PlaidLinkButtonProps {
  onGetLinkToken: () => Promise<string | null>
  onSuccess: (
    publicToken: string,
    metadata: { institution: { institution_id: string; name: string } },
  ) => void
  disabled?: boolean
}

export function PlaidLinkButton({ onGetLinkToken, onSuccess, disabled }: PlaidLinkButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = useCallback(async () => {
    setIsLoading(true)
    try {
      const linkToken = await onGetLinkToken()
      if (!linkToken) {
        setIsLoading(false)
        return
      }

      // Use Plaid Link's handler approach (non-hook API)
      const handler = (
        window as unknown as { Plaid?: { create: (config: unknown) => { open: () => void } } }
      ).Plaid?.create({
        token: linkToken,
        onSuccess: (
          public_token: string,
          metadata: { institution: { institution_id: string; name: string } },
        ) => {
          onSuccess(public_token, metadata)
        },
        onExit: () => {
          setIsLoading(false)
        },
      })

      if (handler) {
        ;(handler as { open: () => void }).open()
      } else {
        // Fallback: If Plaid Link JS isn't loaded, show an error
        setIsLoading(false)
        alert('Plaid Link could not be initialized. Please try again.')
      }
    } catch {
      setIsLoading(false)
    }
  }, [onGetLinkToken, onSuccess])

  return (
    <Button onClick={handleClick} disabled={disabled || isLoading}>
      {isLoading ? 'Connecting...' : 'Connect Bank Account'}
    </Button>
  )
}
