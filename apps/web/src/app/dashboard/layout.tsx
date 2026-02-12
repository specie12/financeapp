'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  DollarSign,
  Target,
  Landmark,
  LineChart,
  Home,
  Scale,
  Building2,
  GitBranch,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { clearTokens, getAccessToken, createAuthenticatedApiClient } from '@/lib/auth'
import { NotificationBell } from '@/components/dashboard/notifications'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/net-worth', label: 'Net Worth', icon: TrendingUp },
    ],
  },
  {
    label: 'Money',
    items: [
      { href: '/dashboard/budget', label: 'Budget', icon: Wallet },
      { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { href: '/dashboard/cash-flow', label: 'Cash Flow', icon: DollarSign },
    ],
  },
  {
    label: 'Wealth',
    items: [
      { href: '/dashboard/goals', label: 'Goals', icon: Target },
      { href: '/dashboard/loans', label: 'Loans', icon: Landmark },
      { href: '/dashboard/investments', label: 'Investments', icon: LineChart },
    ],
  },
  {
    label: 'Planning',
    items: [
      { href: '/dashboard/rent-vs-buy', label: 'Rent vs Buy', icon: Home },
      { href: '/dashboard/mortgage-vs-invest', label: 'Mortgage vs Invest', icon: Scale },
      { href: '/dashboard/rental-properties', label: 'Rental Properties', icon: Building2 },
      { href: '/dashboard/scenarios', label: 'Scenarios', icon: GitBranch },
      { href: '/dashboard/tax', label: 'Tax', icon: Receipt },
    ],
  },
]

const settingsItem: NavItem = {
  href: '/dashboard/settings',
  label: 'Settings',
  icon: Settings,
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setAccessToken(getAccessToken())
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

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
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background z-40 flex md:hidden items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="text-sm font-semibold">Finance App</span>
        <NotificationBell accessToken={accessToken} />
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 border-r bg-card z-30 transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b">
            <Link href="/dashboard" className="text-lg font-bold">
              Finance App
            </Link>
          </div>

          {/* Nav sections */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {navSections.map((section) => (
              <div key={section.label} className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                  {section.label}
                </p>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive(pathname, item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}

            <Separator className="my-2" />

            {/* Settings */}
            <Link
              href={settingsItem.href}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(pathname, settingsItem.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <settingsItem.icon className="h-4 w-4" />
              {settingsItem.label}
            </Link>
          </nav>

          {/* Footer */}
          <div className="border-t p-3 flex items-center justify-between">
            <NotificationBell accessToken={accessToken} />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
