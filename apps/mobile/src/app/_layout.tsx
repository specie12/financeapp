import { useEffect } from 'react'
import { Stack, useRouter, useSegments, type Href } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '../lib/auth'
import { LoadingState } from '../components/ui'
import { View } from 'react-native'

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === 'login'

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login' as Href)
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated but on login screen
      router.replace('/(tabs)' as Href)
    }
  }, [isAuthenticated, isLoading, segments, router])

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingState message="Loading..." />
      </View>
    )
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="net-worth" options={{ title: 'Net Worth' }} />
        <Stack.Screen name="scenario/[id]" options={{ title: 'Scenario' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}
