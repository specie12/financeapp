import { Tabs } from 'expo-router'
import { Text, View, StyleSheet } from 'react-native'

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: focused ? '[]' : '[]',
    Scenarios: focused ? '<>' : '<>',
  }

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icons[name] || '?'}</Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E5EA',
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="Dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scenarios"
        options={{
          title: 'Scenarios',
          tabBarIcon: ({ focused }) => <TabIcon name="Scenarios" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    color: '#8E8E93',
  },
  iconFocused: {
    color: '#007AFF',
  },
})
