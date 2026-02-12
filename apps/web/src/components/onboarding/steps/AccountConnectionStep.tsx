'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlaidLinkButton } from '@/components/dashboard/plaid/PlaidLinkButton'
import { usePlaid } from '@/hooks/usePlaid'

interface AccountConnectionStepProps {
  onNext: () => void
  onBack: () => void
  accessToken: string | null
}

export function AccountConnectionStep({ onNext, onBack, accessToken }: AccountConnectionStepProps) {
  const { getLinkToken, exchangeToken, items } = usePlaid(accessToken)

  const handlePlaidSuccess = async (
    publicToken: string,
    metadata: { institution: { institution_id: string; name: string } },
  ) => {
    await exchangeToken(publicToken, metadata.institution.institution_id, metadata.institution.name)
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Connect Your Accounts</CardTitle>
        <CardDescription>
          Link your bank accounts for automatic tracking, or set up manually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {/* Connect Accounts via Plaid */}
          <div className="p-6 rounded-lg border-2 border-border bg-card">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Connect Bank Accounts</h3>
                <p className="text-sm text-muted-foreground">
                  Securely link your accounts for automatic transaction import
                </p>
                {items.length > 0 && (
                  <p className="text-sm text-primary mt-1">
                    {items.length} account{items.length !== 1 ? 's' : ''} connected
                  </p>
                )}
              </div>
              <PlaidLinkButton
                onGetLinkToken={getLinkToken}
                onSuccess={handlePlaidSuccess}
                disabled={!accessToken}
              />
            </div>
          </div>

          {/* Manual Setup - Available */}
          <button
            onClick={onNext}
            className="p-6 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left w-full"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Manual Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your financial information manually
                </p>
              </div>
              <div className="text-primary">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>You can always connect your accounts later from Settings</p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
