import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { Card, LoadingState, ErrorState, MoneyDisplay } from '../../components/ui'
import { useNetWorth } from '../../hooks'
import { useAuth } from '../../lib/auth'

export default function DashboardScreen() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { data, isLoading, error, refetch } = useNetWorth(5)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  if (isLoading && !refreshing) {
    return <LoadingState message="Loading dashboard..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
      </View>

      {/* Net Worth Summary */}
      <TouchableOpacity onPress={() => router.push('/net-worth')}>
        <Card title="Net Worth" style={styles.card}>
          {data && (
            <>
              <MoneyDisplay cents={data.netWorthCents} style={styles.netWorthValue} colorCode />
              <View style={styles.netWorthBreakdown}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Assets</Text>
                  <MoneyDisplay cents={data.totalAssetsCents} style={styles.breakdownValue} />
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Liabilities</Text>
                  <MoneyDisplay cents={data.totalLiabilitiesCents} style={styles.breakdownValue} />
                </View>
              </View>
              <Text style={styles.tapHint}>Tap to see projection</Text>
            </>
          )}
        </Card>
      </TouchableOpacity>

      {/* Asset Breakdown */}
      {data && data.assetsByType.length > 0 && (
        <Card title="Assets by Type" style={styles.card}>
          {data.assetsByType.map((item) => (
            <View key={item.type} style={styles.breakdownRow}>
              <Text style={styles.breakdownRowLabel}>{formatAssetType(item.type)}</Text>
              <MoneyDisplay cents={item.totalValueCents} style={styles.breakdownRowValue} compact />
            </View>
          ))}
        </Card>
      )}

      {/* Liabilities Breakdown */}
      {data && data.liabilitiesByType.length > 0 && (
        <Card title="Liabilities by Type" style={styles.card}>
          {data.liabilitiesByType.map((item) => (
            <View key={item.type} style={styles.breakdownRow}>
              <Text style={styles.breakdownRowLabel}>{formatLiabilityType(item.type)}</Text>
              <MoneyDisplay
                cents={item.totalBalanceCents}
                style={styles.breakdownRowValue}
                compact
              />
            </View>
          ))}
        </Card>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function formatAssetType(type: string): string {
  const map: Record<string, string> = {
    real_estate: 'Real Estate',
    vehicle: 'Vehicles',
    investment: 'Investments',
    cash: 'Cash',
    retirement: 'Retirement',
    other: 'Other',
  }
  return map[type] || type
}

function formatLiabilityType(type: string): string {
  const map: Record<string, string> = {
    mortgage: 'Mortgage',
    auto_loan: 'Auto Loans',
    student_loan: 'Student Loans',
    credit_card: 'Credit Cards',
    personal_loan: 'Personal Loans',
    other: 'Other',
  }
  return map[type] || type
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  netWorthBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownRowLabel: {
    fontSize: 14,
    color: '#333',
  },
  breakdownRowValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
  },
})
