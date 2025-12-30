import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { Stack } from 'expo-router'
import { useState, useCallback } from 'react'
import { Card, LoadingState, ErrorState, MoneyDisplay } from '../components/ui'
import { useNetWorth } from '../hooks'

export default function NetWorthScreen() {
  const [horizonYears, setHorizonYears] = useState(5)
  const { data, isLoading, error, refetch } = useNetWorth(horizonYears)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  if (isLoading && !refreshing) {
    return (
      <>
        <Stack.Screen options={{ title: 'Net Worth' }} />
        <LoadingState message="Loading projection..." />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Net Worth' }} />
        <ErrorState message={error} onRetry={refetch} />
      </>
    )
  }

  const projection = data?.projection || []
  const startValue = projection[0]?.netWorthCents || 0
  const endValue = projection[projection.length - 1]?.netWorthCents || 0
  const change = endValue - startValue
  const changePercent = startValue !== 0 ? (change / startValue) * 100 : 0

  return (
    <>
      <Stack.Screen options={{ title: 'Net Worth Projection' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        <Card title="Projection Summary" style={styles.card}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Current</Text>
              <MoneyDisplay cents={startValue} style={styles.summaryValue} compact />
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Year {horizonYears}</Text>
              <MoneyDisplay cents={endValue} style={styles.summaryValue} compact />
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Change</Text>
              <MoneyDisplay cents={change} style={styles.summaryValue} showSign colorCode compact />
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Growth</Text>
              <Text style={[styles.summaryValue, change >= 0 ? styles.positive : styles.negative]}>
                {change >= 0 ? '+' : ''}
                {changePercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Horizon Selector */}
        <Card title="Projection Horizon" style={styles.card}>
          <View style={styles.horizonSelector}>
            {[5, 10, 15, 20, 30].map((years) => (
              <HorizonButton
                key={years}
                years={years}
                isSelected={horizonYears === years}
                onPress={() => setHorizonYears(years)}
              />
            ))}
          </View>
        </Card>

        {/* Visual Projection */}
        <Card title="Year-by-Year Projection" style={styles.card}>
          {projection.map((point, index) => {
            const maxNetWorth = Math.max(...projection.map((p) => Math.abs(p.netWorthCents)))
            const barWidth =
              maxNetWorth > 0 ? (Math.abs(point.netWorthCents) / maxNetWorth) * 100 : 0
            const isPositive = point.netWorthCents >= 0

            return (
              <View key={index} style={styles.projectionRow}>
                <View style={styles.projectionLabelContainer}>
                  <Text style={styles.projectionLabel}>
                    {point.year === 0 ? 'Now' : `Year ${point.year}`}
                  </Text>
                  <Text style={styles.projectionYear}>{new Date(point.date).getFullYear()}</Text>
                </View>
                <View style={styles.projectionBarContainer}>
                  <View
                    style={[
                      styles.projectionBar,
                      { width: `${barWidth}%` },
                      isPositive ? styles.positiveBar : styles.negativeBar,
                    ]}
                  />
                </View>
                <MoneyDisplay
                  cents={point.netWorthCents}
                  style={styles.projectionValue}
                  compact
                  colorCode
                />
              </View>
            )
          })}
        </Card>

        {/* Detailed Table */}
        <Card title="Detailed Breakdown" style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.yearCell]}>Year</Text>
            <Text style={[styles.tableHeaderCell, styles.valueCell]}>Assets</Text>
            <Text style={[styles.tableHeaderCell, styles.valueCell]}>Liabilities</Text>
            <Text style={[styles.tableHeaderCell, styles.valueCell]}>Net Worth</Text>
          </View>
          {projection.map((point, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.yearCell]}>
                {point.year === 0 ? 'Now' : point.year}
              </Text>
              <MoneyDisplay
                cents={point.totalAssetsCents}
                style={[styles.tableCell, styles.valueCell]}
                compact
              />
              <MoneyDisplay
                cents={point.totalLiabilitiesCents}
                style={[styles.tableCell, styles.valueCell]}
                compact
              />
              <MoneyDisplay
                cents={point.netWorthCents}
                style={[styles.tableCell, styles.valueCell]}
                compact
                colorCode
              />
            </View>
          ))}
        </Card>
      </ScrollView>
    </>
  )
}

interface HorizonButtonProps {
  years: number
  isSelected: boolean
  onPress: () => void
}

function HorizonButton({ years, isSelected, onPress }: HorizonButtonProps) {
  return (
    <View
      style={[styles.horizonButton, isSelected && styles.horizonButtonSelected]}
      onTouchEnd={onPress}
    >
      <Text style={[styles.horizonButtonText, isSelected && styles.horizonButtonTextSelected]}>
        {years}y
      </Text>
    </View>
  )
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
  card: {
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  positive: {
    color: '#16A34A',
  },
  negative: {
    color: '#DC2626',
  },
  horizonSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  horizonButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  horizonButtonSelected: {
    backgroundColor: '#007AFF',
  },
  horizonButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  horizonButtonTextSelected: {
    color: '#fff',
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  projectionLabelContainer: {
    width: 60,
  },
  projectionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  projectionYear: {
    fontSize: 10,
    color: '#999',
  },
  projectionBarContainer: {
    flex: 1,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  projectionBar: {
    height: '100%',
    borderRadius: 4,
  },
  positiveBar: {
    backgroundColor: '#16A34A',
  },
  negativeBar: {
    backgroundColor: '#DC2626',
  },
  projectionValue: {
    width: 70,
    fontSize: 12,
    textAlign: 'right',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 12,
  },
  yearCell: {
    width: 40,
  },
  valueCell: {
    flex: 1,
    textAlign: 'right',
  },
})
