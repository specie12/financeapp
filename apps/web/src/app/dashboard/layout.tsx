'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { clearTokens, getAccessToken, createAuthenticatedApiClient } from '@/lib/auth'

const navItems = [
  { href: '/dashboard/net-worth', label: 'Net Worth' },
  { href: '/dashboard/loans', label: 'Loans' },
  { href: '/dashboard/investments', label: 'Investments' },
  { href: '/dashboard/rent-vs-buy', label: 'Rent vs Buy' },
  { href: '/dashboard/scenarios', label: 'Scenarios' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const token = getAccessToken()
      if (token) {
        const apiClient = createAuthenticatedApiClient(token)
        await apiClient.auth.logout()
      }
    } catch {
      // Ignore errors - we're logging out anyway
    }
    clearTokens()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold">
              Finance Dashboard
            </Link>
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
