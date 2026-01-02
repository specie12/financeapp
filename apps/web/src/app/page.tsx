import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Finance App</h1>
      <p className="mt-4 text-lg text-gray-600">Welcome to your personal finance manager</p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/onboarding"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </main>
  )
}
