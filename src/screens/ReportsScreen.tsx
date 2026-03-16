import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { addMonths, format } from 'date-fns';
import { Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { useReports } from '@/hooks/useReports';
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart';

export function ReportsScreen() {
  const theme = useTheme();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const { data, isLoading, error } = useReports('month', monthDate);

  const monthLabel = format(monthDate, 'LLLL yyyy');
  const canGoNextMonth = format(addMonths(monthDate, 1), 'yyyy-MM') <= format(new Date(), 'yyyy-MM');

  const expenseBreakdown = useMemo(
    () => buildBreakdown(data?.expenseByCategory ?? [], expensePalette),
    [data?.expenseByCategory]
  );
  const incomeBreakdown = useMemo(
    () => buildBreakdown(data?.incomeByCategory ?? [], incomePalette),
    [data?.incomeByCategory]
  );
  const activeBreakdown = activeType === 'expense' ? expenseBreakdown : incomeBreakdown;
  const activeTotal = activeType === 'expense' ? data?.expenseTotal ?? 0 : data?.incomeTotal ?? 0;
  const activeTitle = activeType === 'expense' ? 'Expenses by category' : 'Income by category';
  const activeSubtitle = activeType === 'expense' ? 'Spent this month' : 'Received this month';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Reports</Text>

      <Card style={[styles.periodCard, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content style={styles.periodCardContent}>
          <Text style={styles.periodLabel}>Selected month</Text>
          <View style={styles.monthSwitch}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMonthDate((current) => addMonths(current, -1))}
              style={styles.monthButton}>
              <Text style={[styles.monthButtonText, { color: theme.colors.onSurface }]}>‹</Text>
            </Pressable>
            <Text variant="titleLarge">{monthLabel}</Text>
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
        </Card.Content>
      </Card>

      {isLoading ? <Text>Loading…</Text> : null}
      {error ? <Text>Failed to load reports.</Text> : null}

      {data ? (
        <>
          {data.missingRates.length ? (
            <Card mode="outlined">
              <Card.Content>
                <Text>
                  Some currencies are missing exchange rates to {data.baseCurrency}. Totals may be incomplete.
                </Text>
              </Card.Content>
            </Card>
          ) : null}

          <Card style={styles.card}>
            <Card.Content style={styles.chartCardContent}>
              <View style={styles.chartHeader}>
                <Text variant="titleMedium">{activeTitle}</Text>
                <SegmentedButtons
                  value={activeType}
                  onValueChange={(value) => setActiveType(value as 'expense' | 'income')}
                  buttons={[
                    { value: 'expense', label: 'Expenses' },
                    { value: 'income', label: 'Income' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </View>
              {activeBreakdown.chartData.length ? (
                <>
                  <CategoryDonutChart
                    data={activeBreakdown.chartData}
                    total={formatMoney(activeTotal, data.baseCurrency)}
                    subtitle={activeSubtitle}
                  />
                  <View style={styles.legendList}>
                    {activeBreakdown.legend.map((item) => (
                      <View key={item.label} style={styles.legendRow}>
                        <View style={styles.legendInfo}>
                          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                          <Text variant="bodyMedium">{item.label}</Text>
                        </View>
                        <View style={styles.legendValues}>
                          <Text variant="bodyMedium">{formatMoney(item.amount, data.baseCurrency)}</Text>
                          <Text style={styles.legendPercent}>{item.percent}%</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.subtitle}>
                  {activeType === 'expense' ? 'No expense data for this month.' : 'No income data for this month.'}
                </Text>
              )}
            </Card.Content>
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

function buildBreakdown(
  items: Array<{ category: { name: string } | null; amount: number }>,
  palette: string[]
) {
  const filtered = items.filter((item) => item.amount > 0);
  const total = filtered.reduce((sum, item) => sum + item.amount, 0);
  const topItems = filtered.slice(0, 5);
  const remaining = filtered.slice(5);
  const otherAmount = remaining.reduce((sum, item) => sum + item.amount, 0);
  const merged = otherAmount > 0 ? [...topItems, { category: { name: 'Other' }, amount: otherAmount }] : topItems;

  return {
    chartData: merged.map((item, index) => ({
      x: item.category?.name ?? 'Uncategorized',
      y: item.amount,
      color: palette[index % palette.length],
    })),
    legend: merged.map((item, index) => ({
      label: item.category?.name ?? 'Uncategorized',
      amount: item.amount,
      percent: total > 0 ? Math.round((item.amount / total) * 100) : 0,
      color: palette[index % palette.length],
    })),
  };
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

const expensePalette = ['#D14B61', '#F27C66', '#F2B872', '#C95F54', '#8B2E3F', '#5C1C2A'];
const incomePalette = ['#1D9B5F', '#39B980', '#63C99C', '#8FDAB7', '#0C6E42', '#064A2D'];

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  subtitle: { opacity: 0.7 },
  card: { borderRadius: 16 },
  periodCard: { borderRadius: 24 },
  periodCardContent: { gap: 12 },
  periodLabel: {
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
  },
  monthSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  chartCardContent: {
    gap: 18,
  },
  chartHeader: {
    gap: 12,
  },
  segmentedButtons: {
    alignSelf: 'stretch',
  },
  legendList: {
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  legendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendValues: {
    alignItems: 'flex-end',
    gap: 2,
  },
  legendPercent: {
    opacity: 0.55,
    fontSize: 12,
  },
});
