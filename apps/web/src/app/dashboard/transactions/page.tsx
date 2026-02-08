'use client'

import { useEffect, useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { TransactionList, TransactionFilters } from '@/components/dashboard/transactions'

export default function TransactionsPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | undefined>()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>()
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const filters = {
    page: currentPage,
    limit: 20,
    type: selectedType as 'income' | 'expense' | 'transfer' | undefined,
    categoryId: selectedCategoryId,
  }

  const { transactions, page, totalPages, isLoading, error, refetch } = useTransactions(
    accessToken,
    filters,
  )
  const { categories } = useCategories(accessToken)

  const handleReset = () => {
    setSelectedType(undefined)
    setSelectedCategoryId(undefined)
    setCurrentPage(1)
  }

  const handleTypeChange = (type: string | undefined) => {
    setSelectedType(type)
    setCurrentPage(1)
  }

  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId)
    setCurrentPage(1)
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <ErrorState title="Not Authenticated" message="Please log in to view your transactions." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <LoadingState message="Loading transactions..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transactions</h1>

      <TransactionFilters
        selectedType={selectedType}
        selectedCategoryId={selectedCategoryId}
        categories={categories}
        onTypeChange={handleTypeChange}
        onCategoryChange={handleCategoryChange}
        onReset={handleReset}
      />

      <TransactionList
        transactions={transactions}
        page={page}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
