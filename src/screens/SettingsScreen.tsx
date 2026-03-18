import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Card, List, Switch, Text } from 'react-native-paper';

import { supabase } from '@/services/supabase/client';
import { useThemeMode } from '@/providers/ThemeModeProvider';

export function SettingsScreen() {
  const { mode, toggle } = useThemeMode();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Settings</Text>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">Appearance</Text>
          <List.Item
            title="Dark mode"
            description="Switch between light and dark theme"
            right={() => <Switch value={mode === 'dark'} onValueChange={toggle} />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">Manage</Text>
          <Link href="/budgets" asChild>
            <Button mode="outlined">Manage budgets</Button>
          </Link>
          <Link href="/categories" asChild>
            <Button mode="outlined">Manage categories</Button>
          </Link>
          <Link href="/transaction/new" asChild>
            <Button mode="contained">Add transaction</Button>
          </Link>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">Account</Text>
          <Button mode="outlined" onPress={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  card: { borderRadius: 20 },
  cardContent: { gap: 12 },
});
