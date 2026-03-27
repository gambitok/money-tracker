import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { addMonths, format, isToday, isYesterday, parseISO } from 'date-fns';
import { SymbolView } from 'expo-symbols';
import { Button, Card, Icon, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';

import { useFeed } from '@/hooks/useFeed';
import { useBudgets } from '@/hooks/useBudgets';
import { SelectField, type SelectOption } from '@/components/fields/SelectField';
import type { TransactionType } from '@/types/domain';

export function TransactionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { data, isLoading, error } = useFeed(monthDate);
  const { data: budgets } = useBudgets(monthDate);
  const incomeColor = '#1D9B5F';
  const expenseColor = '#D14B61';

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of data?.categories ?? []) map.set(c.id, c.name);
    return map;
  }, [data?.categories]);

  const categoryMetaById = useMemo(() => {
    const map = new Map<string, { color: string | null; icon: string | null }>();
    for (const category of data?.categories ?? []) {
      map.set(category.id, { color: category.color, icon: category.icon });
    }
    return map;
  }, [data?.categories]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (data?.transactions ?? []).filter((transaction) => {
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
      if (categoryFilter && transaction.category_id !== categoryFilter) return false;

      if (!normalizedSearch) return true;

      const categoryName = categoryNameById.get(transaction.category_id ?? '') ?? 'uncategorized';
      const haystack = `${categoryName} ${transaction.description ?? ''} ${transaction.currency}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [categoryFilter, categoryNameById, data?.transactions, search, typeFilter]);

  const sections = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof data>['transactions']>();

    for (const transaction of filteredTransactions) {
      const current = groups.get(transaction.date) ?? [];
      current.push(transaction);
      groups.set(transaction.date, current);
    }

    return Array.from(groups.entries()).map(([date, transactions]) => ({
      title: formatSectionDate(date),
      date,
      data: transactions,
    }));
  }, [filteredTransactions]);

  const categoryOptions = useMemo<SelectOption<string>[]>(() => {
    return (data?.categories ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((category) => ({
        value: category.id,
        label: category.name,
        leadingColor: category.color ?? undefined,
      }));
  }, [data?.categories]);

  const budgetWarnings = useMemo(() => {
    const budgetMap = new Map((budgets ?? []).map((budget) => [budget.category_id, Number(budget.amount)]));
    const spendingByCategory = new Map<string, number>();

    for (const transaction of data?.transactions ?? []) {
      if (transaction.type !== 'expense' || !transaction.category_id) continue;
      spendingByCategory.set(
        transaction.category_id,
        (spendingByCategory.get(transaction.category_id) ?? 0) + Number(transaction.amount)
      );
    }

    return Array.from(spendingByCategory.entries())
      .filter(([categoryId]) => budgetMap.has(categoryId))
      .map(([categoryId, spent]) => {
        const budgetAmount = budgetMap.get(categoryId)!;
        const progress = budgetAmount > 0 ? spent / budgetAmount : 0;
        return {
          categoryId,
          label: categoryNameById.get(categoryId) ?? 'Category',
          spent,
          budgetAmount,
          progress,
        };
      })
      .filter((item) => item.progress >= 0.8)
      .sort((a, b) => b.progress - a.progress);
  }, [budgets, categoryNameById, data?.transactions]);

  const budgetWarningByCategoryId = useMemo(() => {
    return new Map(budgetWarnings.map((item) => [item.categoryId, item]));
  }, [budgetWarnings]);

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

          {budgetWarnings.length ? (
            <Card mode="outlined" style={styles.warningCard}>
              <Card.Content style={styles.warningCardContent}>
                <Text variant="titleSmall">Budget alerts</Text>
                {budgetWarnings.slice(0, 3).map((item) => (
                  <Text key={item.categoryId} style={styles.warningText}>
                    {item.label}: {item.progress >= 1 ? 'over budget' : `${Math.round(item.progress * 100)}% of budget used`}
                  </Text>
                ))}
              </Card.Content>
            </Card>
          ) : null}

          <Card mode="outlined" style={styles.filtersCard}>
            <Card.Content style={styles.filtersContent}>
              <TextInput
                label="Search"
                mode="outlined"
                value={search}
                onChangeText={setSearch}
                placeholder="Description, category or currency"
              />

              <SegmentedButtons
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as 'all' | TransactionType)}
                buttons={[
                  { value: 'all', label: 'All' },
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' },
                ]}
              />

              <SelectField
                label="Category filter"
                value={categoryFilter}
                options={categoryOptions}
                allowNull
                nullLabel="All categories"
                placeholder="All categories"
                onChange={setCategoryFilter}
              />
            </Card.Content>
          </Card>

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
        const iconName = categoryMeta?.icon ?? (item.type === 'income' ? 'cash-plus' : 'credit-card-outline');
        const budgetWarning = item.type === 'expense' && item.category_id ? budgetWarningByCategoryId.get(item.category_id) : null;

        return (
          <Pressable
            onPress={() => router.push(`/transaction/${item.id}`)}
            style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}>
            <View style={[styles.iconWrap, { backgroundColor: categoryMeta?.color ?? theme.colors.surfaceVariant }]}>
              <Icon source={iconName} size={18} color={theme.colors.onSurface} />
            </View>

            <View style={styles.rowText}>
              <Text variant="titleSmall">{categoryName}</Text>
              <Text style={styles.descriptionText}>
                {description ? description : item.type === 'income' ? 'Income transaction' : 'Expense transaction'}
              </Text>
              {budgetWarning ? (
                <Text style={[styles.descriptionText, styles.inlineWarning]}>
                  {budgetWarning.progress >= 1 ? 'Over budget' : `${Math.round(budgetWarning.progress * 100)}% of budget used`}
                </Text>
              ) : null}
            </View>

            <View style={styles.amountWrap}>
              <Text variant="titleSmall" style={{ color: amountColor }}>
                {`${sign}${item.amount.toFixed(2)}`}
              </Text>
              <Text style={styles.currencyText}>{item.currency}</Text>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        !isLoading && !error ? (
          <Card mode="outlined">
            <Card.Content>
              <Text style={styles.emptyTitle}>
                {search || typeFilter !== 'all' || categoryFilter ? 'No matching transactions.' : 'No transactions this month.'}
              </Text>
              <Text style={styles.subtitle}>
                {search || typeFilter !== 'all' || categoryFilter
                  ? 'Try changing the search or filters.'
                  : 'Add your first income or expense to start the feed.'}
              </Text>
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
  filtersCard: {
    borderRadius: 20,
  },
  filtersContent: {
    gap: 12,
  },
  warningCard: {
    borderRadius: 18,
  },
  warningCardContent: {
    gap: 6,
  },
  warningText: {
    color: '#D14B61',
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
  inlineWarning: {
    color: '#D14B61',
    opacity: 1,
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
