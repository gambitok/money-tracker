import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { useDeleteRecurringTransaction, useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useFeedback } from '@/providers/FeedbackProvider';

export function RecurringTransactionsScreen() {
  const { data, isLoading, error } = useRecurringTransactions();
  const deleteRecurring = useDeleteRecurringTransaction();
  const { showMessage } = useFeedback();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Recurring</Text>
      <Text style={styles.subtitle}>Monthly recurring rules are generated automatically into your feed.</Text>

      {isLoading ? <Text>Loading…</Text> : null}
      {error ? <Text>Failed to load recurring transactions.</Text> : null}
      {!isLoading && !error && !(data ?? []).length ? <Text style={styles.subtitle}>No recurring transactions yet.</Text> : null}

      {(data ?? []).map((item) => (
        <Card key={item.id} style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium">{item.description?.trim() || 'Recurring transaction'}</Text>
            <Text style={styles.subtitle}>
              {item.type} • {Number(item.amount).toFixed(2)} {item.currency}
            </Text>
            <Text style={styles.subtitle}>Next run: {item.next_run_date}</Text>
            <Button
              mode="outlined"
              textColor="#D14B61"
              onPress={async () => {
                await deleteRecurring.mutateAsync(item.id);
                showMessage('Recurring transaction deleted');
              }}>
              Delete rule
            </Button>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, paddingBottom: 32 },
  card: { borderRadius: 20 },
  cardContent: { gap: 8 },
  subtitle: { opacity: 0.7 },
});
