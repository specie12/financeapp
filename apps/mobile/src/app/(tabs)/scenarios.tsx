import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useState, useCallback } from 'react'
import { Card, LoadingState, ErrorState } from '../../components/ui'
import { useScenarios } from '../../hooks'
import type { Scenario } from '@finance-app/shared-types'

export default function ScenariosScreen() {
  const router = useRouter()
  const { scenarios, isLoading, error, refetch } = useScenarios()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  if (isLoading && !refreshing) {
    return <LoadingState message="Loading scenarios..." />
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
      <Text style={styles.header}>What-If Scenarios</Text>
      <Text style={styles.description}>
        Explore how changes to your financial assumptions affect your projections.
      </Text>

      {scenarios.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No scenarios created yet.</Text>
          <Text style={styles.emptyHint}>Create scenarios in the web app to see them here.</Text>
        </Card>
      ) : (
        scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onPress={() => router.push(`/scenario/${scenario.id}` as Href)}
          />
        ))
      )}
    </ScrollView>
  )
}

interface ScenarioCardProps {
  scenario: Scenario
  onPress: () => void
}

function ScenarioCard({ scenario, onPress }: ScenarioCardProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.scenarioCard}>
        <View style={styles.scenarioHeader}>
          <Text style={styles.scenarioName}>{scenario.name}</Text>
          {scenario.isBaseline && (
            <View style={styles.baselineBadge}>
              <Text style={styles.baselineText}>Baseline</Text>
            </View>
          )}
        </View>
        {scenario.description && (
          <Text style={styles.scenarioDescription} numberOfLines={2}>
            {scenario.description}
          </Text>
        )}
        <View style={styles.scenarioMeta}>
          <Text style={styles.overrideCount}>
            {scenario.overrides.length} override{scenario.overrides.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.tapHint}>Tap to view projection</Text>
        </View>
      </Card>
    </TouchableOpacity>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  scenarioCard: {
    marginBottom: 12,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioName: {
    fontSize: 18,
    fontWeight: '600',
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
  scenarioDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  scenarioMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overrideCount: {
    fontSize: 12,
    color: '#999',
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
  },
})
