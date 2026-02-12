'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlaid } from '@/hooks/usePlaid'
import {
  PlaidLinkButton,
  ConnectedAccountsList,
  PlaidSyncStatus,
} from '@/components/dashboard/plaid'

export default function ConnectedAccountsPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { items, isLoading, error, getLinkToken, exchangeToken, syncItem, deleteItem } =
    usePlaid(accessToken)

  const handlePlaidSuccess = async (
    publicToken: string,
    metadata: { institution: { institution_id: string; name: string } },
  ) => {
    await exchangeToken(publicToken, metadata.institution.institution_id, metadata.institution.name)
  }

  if (error === 'Bank connections require a Pro or Premium plan') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Link your bank accounts, investment accounts, and credit cards for automatic syncing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <svg
                  className="h-8 w-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
              <p className="text-muted-foreground max-w-sm">
                Bank connections are available on Pro and Premium plans. Upgrade to automatically
                sync your account balances and transactions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Link your bank accounts, investment accounts, and credit cards for automatic syncing
              </CardDescription>
            </div>
            <PlaidLinkButton onGetLinkToken={getLinkToken} onSuccess={handlePlaidSuccess} />
          </div>
          {items.length > 0 && <PlaidSyncStatus items={items} />}
        </CardHeader>
        <CardContent>
          <ConnectedAccountsList
            items={items}
            onSync={syncItem}
            onDelete={deleteItem}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
