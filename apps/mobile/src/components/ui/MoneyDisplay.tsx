import { Text, StyleSheet, type TextStyle, type StyleProp } from 'react-native'

interface MoneyDisplayProps {
  cents: number
  style?: StyleProp<TextStyle>
  showSign?: boolean
  colorCode?: boolean
  compact?: boolean
}

export function MoneyDisplay({
  cents,
  style,
  showSign = false,
  colorCode = false,
  compact = false,
}: MoneyDisplayProps) {
  const dollars = cents / 100
  const isPositive = dollars >= 0
  const absValue = Math.abs(dollars)

  let formatted: string
  if (compact && absValue >= 1000000) {
    formatted = `$${(absValue / 1000000).toFixed(1)}M`
  } else if (compact && absValue >= 1000) {
    formatted = `$${(absValue / 1000).toFixed(1)}K`
  } else {
    formatted = `$${absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (showSign && isPositive && cents !== 0) {
    formatted = '+' + formatted
  } else if (!isPositive) {
    formatted = '-' + formatted
  }

  const colorStyle = colorCode ? (isPositive ? styles.positive : styles.negative) : undefined

  return <Text style={[styles.base, colorStyle, style]}>{formatted}</Text>
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
  },
  positive: {
    color: '#16A34A',
  },
  negative: {
    color: '#DC2626',
  },
})
