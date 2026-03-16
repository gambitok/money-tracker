import { useQuery } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth } from 'date-fns';

import { useSession } from '@/providers/SessionProvider';
import { listTransactions } from '@/services/repositories/transactionsRepository';
import { listCategories } from '@/services/repositories/categoriesRepository';
import { listExchangeRates } from '@/services/repositories/exchangeRatesRepository';
import { getUserProfile } from '@/services/repositories/userRepository';
import { buildRatesMap, convertToBase } from '@/services/usecases/currencyConverter';
import type { Category, Transaction } from '@/types/domain';

export type FeedSummary = {
  baseCurrency: string;
  income: number;
  expense: number;
  balance: number;
  missingRates: string[];
  transactions: Transaction[];
  categories: Category[];
};

export function useFeed(monthDate: Date) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const from = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const to = format(endOfMonth(monthDate), 'yyyy-MM-dd');

  return useQuery({
    queryKey: userId ? ['feed', userId, from, to] : ['feed', 'no-user'],
    enabled: !!userId,
    queryFn: async (): Promise<FeedSummary> => {
      const profile = await getUserProfile(userId!);
      const baseCurrency = profile.base_currency.toUpperCase();

      const [transactions, incomeCategories, expenseCategories] = await Promise.all([
        listTransactions({ userId: userId!, from, to }),
        listCategories({ userId: userId!, type: 'income' }),
        listCategories({ userId: userId!, type: 'expense' }),
      ]);

      const currencies = Array.from(
        new Set(transactions.map((transaction) => transaction.currency.toUpperCase()).filter((c) => c !== baseCurrency))
      );
      const rates = buildRatesMap(await listExchangeRates({ toCurrency: baseCurrency, fromCurrencies: currencies }));
      const missingRates = new Set<string>();

      let income = 0;
      let expense = 0;

      for (const transaction of transactions) {
        const result = convertToBase({
          amount: Number(transaction.amount),
          fromCurrency: transaction.currency,
          baseCurrency,
          rates,
        });

        result.missingRates.forEach((rateKey) => missingRates.add(rateKey));

        if (transaction.type === 'income') {
          income += result.amount;
        } else {
          expense += result.amount;
        }
      }

      return {
        baseCurrency,
        income,
        expense,
        balance: income - expense,
        missingRates: Array.from(missingRates),
        transactions,
        categories: [...incomeCategories, ...expenseCategories],
      };
    },
  });
}
