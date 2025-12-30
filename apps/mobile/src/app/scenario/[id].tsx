import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useState, useCallback } from 'react'
import { Card, LoadingState, ErrorState, MoneyDisplay } from '../../components/ui'
import { useScenarioProjection } from '../../hooks'

export default function ScenarioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [horizonYears, setHorizonYears] = useState(5)
  const { projection, isLoading, error, refetch } = useScenarioProjection(id, horizonYears)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  if (isLoading && !refreshing) {
    return (
      <>
        <Stack.Screen options={{ title: 'Scenario' }} />
        <LoadingState message="Loading projection..." />
      </>
    )
  }

  if (error || !projection) {
    return (
      <>
        <Stack.Screen options={{ title: 'Scenario' }} />
        <ErrorState message={error || 'Scenario not found'} onRetry={refetch} />
      </>
    )
  }

  const { scenario, summary, yearlySnapshots } = projection

  return (
    <>
      <Stack.Screen
        options={{
          title: scenario.name,
          headerBackTitle: 'Scenarios',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Scenario Info */}
        <Card style={styles.card}>
          <View style={styles.scenarioHeader}>
            <Text style={styles.scenarioName}>{scenario.name}</Text>
            {scenario.isBaseline && (
              <View style={styles.baselineBadge}>
                <Text style={styles.baselineText}>Baseline</Text>
              </View>
            )}
          </View>
          {scenario.description && <Text style={styles.description}>{scenario.description}</Text>}
        </Card>

        {/* Summary Card */}
        <Card title="Projection Summary" style={styles.card}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Starting Net Worth</Text>
              <MoneyDisplay
                cents={summary.startingNetWorthCents}
                style={styles.summaryValue}
                compact
              />
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ending Net Worth</Text>
              <MoneyDisplay
                cents={summary.endingNetWorthCents}
                style={styles.summaryValue}
                compact
              />
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net Worth Change</Text>
              <MoneyDisplay
                cents={summary.netWorthChangeCents}
                style={styles.summaryValue}
                showSign
                colorCode
                compact
              />
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Growth Rate</Text>
              <Text
                style={[
                  styles.summaryValue,
                  summary.netWorthChangePercent >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {summary.netWorthChangePercent >= 0 ? '+' : ''}
                {summary.netWorthChangePercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Additional Summary */}
        <Card title="Cash Flow Summary" style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Total Income</Text>
            <MoneyDisplay
              cents={summary.totalIncomeOverPeriodCents}
              style={styles.summaryRowValue}
              compact
            />
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Total Expenses</Text>
            <MoneyDisplay
              cents={summary.totalExpensesOverPeriodCents}
              style={styles.summaryRowValue}
              compact
            />
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Debt Paid</Text>
            <MoneyDisplay
              cents={summary.totalDebtPaidCents}
              style={styles.summaryRowValue}
              compact
            />
          </View>
          <View style={[styles.summaryRow, styles.lastRow]}>
            <Text style={styles.summaryRowLabel}>Interest Paid</Text>
            <MoneyDisplay
              cents={summary.totalInterestPaidCents}
              style={styles.summaryRowValue}
              compact
            />
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

        {/* Year-by-Year Projection */}
        <Card title="Year-by-Year Breakdown" style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.yearCell]}>Year</Text>
            <Text style={[styles.tableHeaderCell, styles.valueCell]}>Assets</Text>
            <Text style={[styles.tableHeaderCell, styles.valueCell]}>Liabilities</Text>
            <Text style={[styles.tableHeaderCell, styles.valueCell]}>Net Worth</Text>
          </View>
          {yearlySnapshots.map((point, index) => (
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

        {/* Overrides */}
        {scenario.overrides.length > 0 && (
          <Card
            title="Applied Overrides"
            description={`${scenario.overrides.length} override${scenario.overrides.length !== 1 ? 's' : ''} in this scenario`}
            style={styles.card}
          >
            {scenario.overrides.map((override) => (
              <View key={override.id} style={styles.overrideRow}>
                <Text style={styles.overrideLabel}>
                  {formatTargetType(override.targetType)} - {override.fieldName}
                </Text>
                <Text style={styles.overrideValue}>{override.value}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </>
  )
}

function formatTargetType(type: string): string {
  const map: Record<string, string> = {
    asset: 'Asset',
    liability: 'Liability',
    cash_flow_item: 'Cash Flow',
  }
  return map[type] || type
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
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  baselineBadge: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  baselineText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  summaryRowLabel: {
    fontSize: 14,
    color: '#333',
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: '500',
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
  overrideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  overrideLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  overrideValue: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
})
