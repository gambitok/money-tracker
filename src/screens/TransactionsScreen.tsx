import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { addMonths, format, isToday, isYesterday, parseISO } from 'date-fns';
import { SymbolView } from 'expo-symbols';
import { Button, Card, Text, useTheme } from 'react-native-paper';

import { useFeed } from '@/hooks/useFeed';

export function TransactionsScreen() {
  const theme = useTheme();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const { data, isLoading, error } = useFeed(monthDate);
  const incomeColor = '#1D9B5F';
  const expenseColor = '#D14B61';

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of data?.categories ?? []) map.set(c.id, c.name);
    return map;
  }, [data?.categories]);

  const categoryMetaById = useMemo(() => {
    const map = new Map<string, { color: string | null }>();
    for (const category of data?.categories ?? []) {
      map.set(category.id, { color: category.color });
    }
    return map;
  }, [data?.categories]);

  const sections = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof data>['transactions']>();

    for (const transaction of data?.transactions ?? []) {
      const current = groups.get(transaction.date) ?? [];
      current.push(transaction);
      groups.set(transaction.date, current);
    }

    return Array.from(groups.entries()).map(([date, transactions]) => ({
      title: formatSectionDate(date),
      date,
      data: transactions,
    }));
  }, [data?.transactions]);

  const monthLabel = format(monthDate, 'LLLL yyyy');
  const canGoNextMonth = format(addMonths(monthDate, 1), 'yyyy-MM') <= format(new Date(), 'yyyy-MM');

  return (
    <SectionList
      style={styles.list}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      sections={sections}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text variant="headlineSmall">Feed</Text>

          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content style={styles.summaryContent}>
              <View style={styles.monthSwitch}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMonthDate((current) => addMonths(current, -1))}
                  style={styles.monthButton}>
                  <Text style={[styles.monthButtonText, { color: theme.colors.onSurface }]}>‹</Text>
                </Pressable>
                <Text variant="titleMedium">{monthLabel}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={!canGoNextMonth}
                  onPress={() => setMonthDate((current) => addMonths(current, 1))}
                  style={[styles.monthButton, !canGoNextMonth && styles.monthButtonDisabled]}>
                  <Text
                    style={[
                      styles.monthButtonText,
                      { color: canGoNextMonth ? theme.colors.onSurface : theme.colors.outline },
                    ]}>
                    ›
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.balanceLabel}>Total balance</Text>
              <Text variant="displaySmall" style={styles.balanceValue}>
                {formatMoney(data?.balance ?? 0, data?.baseCurrency ?? '')}
              </Text>

              <View style={styles.totalsRow}>
                <View style={[styles.totalCard, { backgroundColor: theme.colors.surface }]}>
                  <Text style={styles.totalLabel}>Income</Text>
                  <Text variant="titleMedium" style={[styles.totalValue, { color: incomeColor }]}>
                    {formatMoney(data?.income ?? 0, data?.baseCurrency ?? '')}
                  </Text>
                </View>
                <View style={[styles.totalCard, { backgroundColor: theme.colors.surface }]}>
                  <Text style={styles.totalLabel}>Expense</Text>
                  <Text variant="titleMedium" style={[styles.totalValue, { color: expenseColor }]}>
                    {formatMoney(data?.expense ?? 0, data?.baseCurrency ?? '')}
                  </Text>
                </View>
              </View>

              <Link href="/transaction/new" asChild>
                <Button mode="contained">Add transaction</Button>
              </Link>
            </Card.Content>
          </Card>

          <View style={styles.historyHeader}>
            <Text variant="titleMedium">History</Text>
            {data?.missingRates.length ? <Text style={styles.warning}>Some currencies are not converted yet.</Text> : null}
          </View>

          {isLoading ? <Text>Loading…</Text> : null}
          {error ? <Text>Failed to load feed.</Text> : null}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text variant="titleSmall" style={styles.sectionTitle}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => {
        const categoryName = categoryNameById.get(item.category_id ?? '') ?? 'Uncategorized';
        const description = item.description?.trim();
        const sign = item.type === 'expense' ? '-' : '+';
        const amountColor = item.type === 'expense' ? expenseColor : incomeColor;
        const categoryMeta = categoryMetaById.get(item.category_id ?? '');
        const iconName = item.type === 'income' ? 'arrow.down.left.circle.fill' : 'arrow.up.right.circle.fill';

        return (
          <View style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}>
            <View style={[styles.iconWrap, { backgroundColor: categoryMeta?.color ?? theme.colors.surfaceVariant }]}>
              <SymbolView name={iconName} size={18} tintColor={theme.colors.onSurface} />
            </View>

            <View style={styles.rowText}>
              <Text variant="titleSmall">{categoryName}</Text>
              <Text style={styles.descriptionText}>
                {description ? description : item.type === 'income' ? 'Income transaction' : 'Expense transaction'}
              </Text>
            </View>

            <View style={styles.amountWrap}>
              <Text variant="titleSmall" style={{ color: amountColor }}>
                {`${sign}${item.amount.toFixed(2)}`}
              </Text>
              <Text style={styles.currencyText}>{item.currency}</Text>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        !isLoading && !error ? (
          <Card mode="outlined">
            <Card.Content>
              <Text style={styles.emptyTitle}>No transactions this month.</Text>
              <Text style={styles.subtitle}>Add your first income or expense to start the feed.</Text>
            </Card.Content>
          </Card>
        ) : null
      }
    />
  );
}

function formatSectionDate(dateString: string) {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMMM');
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  header: { gap: 14, marginBottom: 12 },
  summaryCard: { borderRadius: 28 },
  summaryContent: { gap: 18 },
  monthSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  monthButtonText: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
    marginTop: -2,
  },
  monthButtonDisabled: {
    opacity: 0.45,
  },
  balanceLabel: {
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  balanceValue: {
    fontWeight: '700',
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  totalCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    gap: 8,
  },
  totalLabel: {
    opacity: 0.7,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalValue: {
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  warning: {
    opacity: 0.7,
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 6,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  descriptionText: {
    opacity: 0.65,
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  currencyText: {
    opacity: 0.55,
    fontSize: 12,
  },
  emptyTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  subtitle: { opacity: 0.7 },
});
