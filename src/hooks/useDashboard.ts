import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/providers/SessionProvider';
import { getUserProfile } from '@/services/repositories/userRepository';
import { listAllTransactionsForUser, listTransactions } from '@/services/repositories/transactionsRepository';
import { listExchangeRates } from '@/services/repositories/exchangeRatesRepository';
import { buildRatesMap, convertToBase } from '@/services/usecases/currencyConverter';
import { getPresetRange } from '@/utils/dates';
import { listCategories } from '@/services/repositories/categoriesRepository';
import type { Category } from '@/types/domain';

export type DashboardSummary = {
  baseCurrency: string;
  balanceAllTime: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  missingRates: string[];
  expenseByCategory: Array<{ category: Category | null; amount: number }>;
};

export function useDashboard() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const month = getPresetRange('month');

  return useQuery({
    queryKey: userId ? ['dashboard', userId, month.from, month.to] : ['dashboard', 'no-user'],
    enabled: !!userId,
    queryFn: async (): Promise<DashboardSummary> => {
      const profile = await getUserProfile(userId!);
      const baseCurrency = profile.base_currency.toUpperCase();

      const [allTx, monthTx, expenseCategories] = await Promise.all([
        listAllTransactionsForUser({ userId: userId! }),
        listTransactions({ userId: userId!, from: month.from, to: month.to }),
        listCategories({ userId: userId!, type: 'expense' }),
      ]);

      const currencies = Array.from(
        new Set([...allTx, ...monthTx].map((t) => t.currency.toUpperCase()).filter((c) => c !== baseCurrency))
      );
      const rates = buildRatesMap(await listExchangeRates({ toCurrency: baseCurrency, fromCurrencies: currencies }));

      const missingRates = new Set<string>();

      const sumConverted = (txs: typeof monthTx, type: 'income' | 'expense') =>
        txs
          .filter((t) => t.type === type)
          .reduce((acc, t) => {
            const r = convertToBase({
              amount: Number(t.amount),
              fromCurrency: t.currency,
              baseCurrency,
              rates,
            });
            r.missingRates.forEach((k) => missingRates.add(k));
            return acc + r.amount;
          }, 0);

      const incomeThisMonth = sumConverted(monthTx, 'income');
      const expensesThisMonth = sumConverted(monthTx, 'expense');

      const balanceAllTime =
        sumConverted(allTx, 'income') -
        sumConverted(allTx, 'expense');

      const categoriesById = new Map(expenseCategories.map((c) => [c.id, c] as const));

      const expenseByCategoryMap = new Map<string, number>();
      for (const t of monthTx) {
        if (t.type !== 'expense') continue;
        const r = convertToBase({
          amount: Number(t.amount),
          fromCurrency: t.currency,
          baseCurrency,
          rates,
        });
        r.missingRates.forEach((k) => missingRates.add(k));
        const key = t.category_id ?? 'uncategorized';
        expenseByCategoryMap.set(key, (expenseByCategoryMap.get(key) ?? 0) + r.amount);
      }

      const expenseByCategory = Array.from(expenseByCategoryMap.entries())
        .map(([categoryId, amount]) => ({
          category: categoryId === 'uncategorized' ? null : (categoriesById.get(categoryId) ?? null),
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        baseCurrency,
        balanceAllTime,
        incomeThisMonth,
        expensesThisMonth,
        missingRates: Array.from(missingRates),
        expenseByCategory,
      };
    },
  });
}

