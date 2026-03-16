import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { useProfile } from '@/hooks/useProfile';

export function ProfileScreen() {
  const { data, isLoading, error } = useProfile();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Profile</Text>

      {isLoading ? <Text>Loading…</Text> : null}
      {error ? <Text>Failed to load profile.</Text> : null}

      {data ? (
        <>
          <Card style={styles.heroCard}>
            <Card.Content style={styles.heroContent}>
              <View style={styles.avatar}>
                <Text variant="headlineMedium" style={styles.avatarText}>
                  {data.email.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.heroText}>
                <Text variant="titleLarge">{data.email}</Text>
                <Text style={styles.subtitle}>Your personal finance account</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View>
                <Text style={styles.label}>Email</Text>
                <Text variant="titleMedium">{data.email}</Text>
              </View>
              <View>
                <Text style={styles.label}>Base currency</Text>
                <Text variant="titleMedium">{data.base_currency.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.label}>Account ID</Text>
                <Text numberOfLines={1}>{data.id}</Text>
              </View>
            </Card.Content>
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  heroCard: { borderRadius: 24 },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCEBFF',
  },
  avatarText: {
    fontWeight: '700',
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  card: { borderRadius: 20 },
  cardContent: { gap: 18 },
  label: {
    opacity: 0.65,
    marginBottom: 6,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.8,
  },
});
