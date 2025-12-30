import { View, Text, StyleSheet, type ViewStyle } from 'react-native'

interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  style?: ViewStyle
}

export function Card({ title, description, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {description && <Text style={styles.description}>{description}</Text>}
      <View style={title || description ? styles.contentWithHeader : undefined}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contentWithHeader: {
    marginTop: 8,
  },
})
