import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finance App',
  description: 'Manage your finances with ease',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
