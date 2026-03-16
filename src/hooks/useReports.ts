import { useQuery } from '@tanstack/react-query';
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns';

import { useSession } from '@/providers/SessionProvider';
import { getUserProfile } from '@/services/repositories/userRepository';
import { listTransactions } from '@/services/repositories/transactionsRepository';
import { listExchangeRates } from '@/services/repositories/exchangeRatesRepository';
import { buildRatesMap, convertToBase } from '@/services/usecases/currencyConverter';
import { type DateRangePreset } from '@/utils/dates';
import { listCategories } from '@/services/repositories/categoriesRepository';
import type { Category, Transaction } from '@/types/domain';

export type ReportsData = {
  baseCurrency: string;
  from: string;
  to: string;
  incomeTotal: number;
  expenseTotal: number;
  missingRates: string[];
  buckets: Array<{ label: string; income: number; expense: number }>;
  incomeByCategory: Array<{ category: Category | null; amount: number }>;
  expenseByCategory: Array<{ category: Category | null; amount: number }>;
};

function bucketDates(preset: DateRangePreset, from: string, to: string) {
  const interval = { start: parseISO(from), end: parseISO(to) };
  switch (preset) {
    case 'week':
      return eachDayOfInterval(interval).map((d) => ({ date: d, label: format(d, 'EEE') }));
    case 'month':
      return eachWeekOfInterval(interval, { weekStartsOn: 1 }).map((d) => ({ date: d, label: format(d, 'MMM d') }));
    case 'year':
      return eachMonthOfInterval(interval).map((d) => ({ date: d, label: format(d, 'MMM') }));
  }
}

function bucketKey(preset: DateRangePreset, isoDate: string) {
  const d = parseISO(isoDate);
  switch (preset) {
    case 'week':
      return format(d, 'yyyy-MM-dd');
    case 'month':
      return format(d, "RRRR-'W'II");
    case 'year':
      return format(d, 'yyyy-MM');
  }
}

function bucketKeyFromDate(preset: DateRangePreset, d: Date) {
  switch (preset) {
    case 'week':
      return format(d, 'yyyy-MM-dd');
    case 'month':
      return format(d, "RRRR-'W'II");
    case 'year':
      return format(d, 'yyyy-MM');
  }
}

export function useReports(preset: DateRangePreset, monthDate?: Date) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const range =
    preset === 'month' && monthDate
      ? {
          from: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
          to: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
        }
      : {
          from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        };

  return useQuery({
    queryKey: userId ? ['reports', userId, preset, range.from, range.to] : ['reports', 'no-user'],
    enabled: !!userId,
    queryFn: async (): Promise<ReportsData> => {
      const profile = await getUserProfile(userId!);
      const baseCurrency = profile.base_currency.toUpperCase();

      const [txs, incomeCategories, expenseCategories] = await Promise.all([
        listTransactions({ userId: userId!, from: range.from, to: range.to }),
        listCategories({ userId: userId!, type: 'income' }),
        listCategories({ userId: userId!, type: 'expense' }),
      ]);

      const currencies = Array.from(new Set(txs.map((t) => t.currency.toUpperCase()).filter((c) => c !== baseCurrency)));
      const rates = buildRatesMap(await listExchangeRates({ toCurrency: baseCurrency, fromCurrencies: currencies }));
      const missingRates = new Set<string>();

      const convertTx = (t: Transaction) => {
        const r = convertToBase({
          amount: Number(t.amount),
          fromCurrency: t.currency,
          baseCurrency,
          rates,
        });
        r.missingRates.forEach((k) => missingRates.add(k));
        return r.amount;
      };

      let incomeTotal = 0;
      let expenseTotal = 0;

      const bucketsBase = bucketDates(preset, range.from, range.to);
      const bucketMap = new Map<string, { label: string; income: number; expense: number }>();
      for (const b of bucketsBase) {
        bucketMap.set(bucketKeyFromDate(preset, b.date), { label: b.label, income: 0, expense: 0 });
      }

      const incomeCategoriesById = new Map(incomeCategories.map((c) => [c.id, c] as const));
      const expenseCategoriesById = new Map(expenseCategories.map((c) => [c.id, c] as const));
      const incomeByCategoryMap = new Map<string, number>();
      const expenseByCategoryMap = new Map<string, number>();

      for (const t of txs) {
        const amountBase = convertTx(t);
        if (t.type === 'income') {
          incomeTotal += amountBase;
        } else {
          expenseTotal += amountBase;
        }

        const k = bucketKey(preset, t.date);
        const bucket = bucketMap.get(k);
        if (bucket) {
          if (t.type === 'income') bucket.income += amountBase;
          else bucket.expense += amountBase;
        }

        if (t.type === 'income') {
          const catKey = t.category_id ?? 'uncategorized';
          incomeByCategoryMap.set(catKey, (incomeByCategoryMap.get(catKey) ?? 0) + amountBase);
        }

        if (t.type === 'expense') {
          const catKey = t.category_id ?? 'uncategorized';
          expenseByCategoryMap.set(catKey, (expenseByCategoryMap.get(catKey) ?? 0) + amountBase);
        }
      }

      const buckets = Array.from(bucketMap.values());

      const incomeByCategory = Array.from(incomeByCategoryMap.entries())
        .map(([categoryId, amount]) => ({
          category: categoryId === 'uncategorized' ? null : (incomeCategoriesById.get(categoryId) ?? null),
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);

      const expenseByCategory = Array.from(expenseByCategoryMap.entries())
        .map(([categoryId, amount]) => ({
          category: categoryId === 'uncategorized' ? null : (expenseCategoriesById.get(categoryId) ?? null),
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        baseCurrency,
        from: range.from,
        to: range.to,
        incomeTotal,
        expenseTotal,
        missingRates: Array.from(missingRates),
        buckets,
        incomeByCategory,
        expenseByCategory,
      };
    },
  });
}
