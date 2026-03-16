import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/providers/SessionProvider';
import type { DateRangePreset } from '@/utils/dates';
import { getPresetRange } from '@/utils/dates';
import type { TransactionType } from '@/types/domain';
import { createTransaction, listTransactions } from '@/services/repositories/transactionsRepository';

const keys = {
  transactions: (userId: string, preset: DateRangePreset, from: string, to: string) =>
    ['transactions', userId, preset, from, to] as const,
};

export function useTransactions(preset: DateRangePreset) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { from, to } = getPresetRange(preset);

  return useQuery({
    queryKey: userId ? keys.transactions(userId, preset, from, to) : ['transactions', 'no-user'],
    enabled: !!userId,
    queryFn: async () => listTransactions({ userId: userId!, from, to }),
  });
}

export function useCreateTransaction() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      type: TransactionType;
      amount: number;
      currency: string;
      categoryId: string | null;
      description?: string | null;
      date: string;
    }) => {
      if (!userId) throw new Error('Not signed in');
      return createTransaction({ userId, ...input });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['transactions', userId] });
      await qc.invalidateQueries({ queryKey: ['feed', userId] });
      await qc.invalidateQueries({ queryKey: ['dashboard', userId] });
      await qc.invalidateQueries({ queryKey: ['reports', userId] });
    },
  });
}
